# Prompt for the backend agent: recording upload (camera now, screen kept)

> Paste everything below the line into a session opened in the **backend repository** (`test-insight-studio-be`).
> It was written by the frontend agent (Track A) after the frontend side was built and checked in a real browser.

---

You are working in the backend repository as **Track B** (backend & database). Follow its `AGENTS.md`: read
`docs/architecture.md`, `contracts/openapi.yaml`, `docs/security.md`, `docs/data-model.md` and `docs/decisions.md`
first; change the contract **before** the implementation and give Track A (the frontend) the chance to review it;
do not deploy, push or commit without approval; report only checks you really ran.

## Goal

Implement the respondent recording slice that the contract already lists as `proposed` and that still answers
`501 not_implemented`: `createUploadUrl`, `verifyRecording` and `completeProject`, with the `recordings` table, the
`recordings` Storage bucket rules and the `ProjectReady` event (migrations 9-11 in `docs/data-model.md`).

**Decision from the product owner: only the camera recording (webcam video with microphone audio) is recorded for
now. The screen recording stays in the system but is switched off.** So:

* Implement and test **both** kinds (`camera` and `screen`) completely: endpoints, `recordings` rows
  (`unique (project_id, kind)`), Storage paths, `progress.recordings.screen`, verification.
* Make the kinds that **`complete` requires** a single, obvious setting, `REQUIRED_RECORDING_KINDS = ['camera']`,
  used by `completeProject` / `complete_project`. Turning the screen recording on later must be a one-line change
  there (plus the frontend's own switch), not a new feature. Today the contract and `docs/data-model.md` say
  "both recordings VERIFIED", which would make `complete` answer `409` forever. Record the decision as an ADR.
* The frontend does not call anything with `kind = screen` at the moment. Do not remove it from the contract.

## Step 1: contract changes first (Track A reviews them)

Propose these edits to `contracts/openapi.yaml`, then pause for Track A's review before implementing:

1. `completeProject`: succeeds when the questionnaire is submitted and every **required** recording is verified
   (currently `camera`); say so in the description. `screen` is optional; its progress is still reported.
2. `verifyRecording`: document the error cases the frontend relies on (see "Frontend behaviour" below):
   * `404 not_found`: no upload was requested for this kind, or the object is not at the expected path;
   * `400 validation_error`: the object is over the size limit, has a disallowed content type, or `durationMs`
     is out of range;
   * `409 conflict`: the project is already `READY`.
3. `completeProject` `409`: it must tell the frontend *why*. The frontend branches on `error.code` only, and
   today `conflict` is also what it shows as "this test can no longer be changed". Preconditions not met
   (questionnaire missing, required recording not verified) deserve their own code (suggestion:
   `project_incomplete`); add it to the `ErrorCode` enum. A project that is already `READY` stays `200` (idempotent).
4. Keep `x-status: proposed` until the implementation exists and Track A has reviewed it.

Track A's review of the shapes as they are (`CreateUploadUrlRequest`, `UploadUrlResponse`, `VerifyRecordingRequest`,
`VerifyRecordingResponse`, `CompleteProjectResponse`): they work for the frontend, subject to the points above.

## Step 2: what the frontend does (design for exactly this)

Per respondent, in this order, every call with `X-Invitation-Token`:

1. `POST /invitation/validate`
2. `PUT /questionnaire-response` with `{ answers: { preSurvey } }`
3. Recording step, for the camera only:
   1. `POST /recordings/camera/upload-url` with `{ contentType }`, where `contentType` is a **bare** `video/webm`
      (Chrome, Edge, Firefox) or `video/mp4` (Safari). Never codec parameters.
   2. The browser uploads straight to Storage with `supabase.storage.from("recordings").uploadToSignedUrl(path, token,
      blob, { contentType })`: a `PUT` to `/storage/v1/object/upload/sign/recordings/<path>?token=<token>` as
      `multipart/form-data` (the file part carries the blob's MIME type, which is what the bucket's
      `allowed_mime_types` is checked against), with `x-upsert: false`. Issue the signed URL **without** upsert.
      The path extension should follow `contentType` (`.webm` / `.mp4`).
   3. `POST /recordings/camera/verify` with `{ durationMs }` (integer, measured in the browser, 1..120000).
4. `PUT /questionnaire-response` with `{ answers: { preSurvey, postSurvey } }`
5. `POST /complete`

Retries the frontend performs, so the backend must allow them:

* **Storage upload failed** (network, 5xx): the frontend asks for a *new* `upload-url` for the same kind. This must
  succeed and replace the unverified attempt (the contract already says so; please also remove the orphaned object).
* **Upload succeeded but `verify` failed with a network error, `5xx` or `429`**: the frontend calls `verify` again,
  **without** a new `upload-url`. `verify` must work repeatedly while the recording is not yet verified, and stay
  idempotent after it is verified.
* **`verify` answered another `4xx`** (for example `404` or `400`): the frontend uploads the file again from the
  start: new `upload-url`, Storage upload, `verify`. So `upload-url` must be accepted again for a kind whose
  attempt was rejected or never verified.
* After a kind is `VERIFIED` the frontend never asks for another `upload-url` for it. If it did, `409 conflict`
  (already in the contract) is right.
* `complete` is retried after a failure and is idempotent on a `READY` project. The frontend skips re-sending
  identical post-survey answers, because `PUT /questionnaire-response` answers `409` on a `READY` project.

Other facts worth knowing:

* Real `MediaRecorder` output measured in Chrome with the frontend's settings (VP9+Opus, 1 Mbps video target,
  64 kbps audio, 640x480): about 10 MB per 120 s for calm content and about 21 MB per 120 s with strong sensor
  noise; pure white noise reached 95 MB and would be rejected by the 50 MiB bucket limit. The frontend does not
  upload files over `limits.maxSizeBytes`, so the bucket limit is a second line of defence, not the normal path.
* WebM from `MediaRecorder` has no duration or seek index (Safari sends MP4). Whatever processes the files later
  must remux/probe them; the stored `durationMs` is client-reported and only range-checked.
* The frontend never logs or stores `token` / `signedUrl`; keep them out of your logs too (already a rule).
* The frontend sends at most one `upload-url` and one `verify` per kind per attempt, and the respondent clicks
  "Try again" by hand. Please make sure the stricter `upload-url` rate limit mentioned in `docs/security.md` leaves
  room for about ten requests per client IP in ten minutes (shared office networks), and tell Track A the number.
* The browser calls Storage directly from the frontend's origin; confirm CORS for that origin on the Storage API
  works with the local and hosted setups, and say what Track C must configure.

## Step 3: implementation checklist

* Migrations (forward-only, RLS on, nothing for `anon`, grants explicit, pgTAP tests): `recording_kind` /
  `recording_status` enums, `recordings` table, Storage bucket handling for hosted environments (the open decision
  in migration 10), `complete_project` with the `ProjectReady` event in the same transaction, driven by
  `REQUIRED_RECORDING_KINDS`.
* `supabase/functions/respondent-api`: the three operations; derive `progress.recordings` from the table instead of
  the hard-coded `NOT_STARTED` in the project presenter; `UPLOAD_REQUESTED` after `upload-url`, `VERIFIED` after
  `verify`. Every query is scoped by the project resolved from the invitation, never by client input.
* `verify`: check the object exists at the server-chosen path, size within the limit, content type allowed, and
  `durationMs` within 1..120000; record `size_bytes`, `content_type`, `client_duration_ms`, `verified_at`.
* Tests: both kinds end to end; `complete` succeeds with only the camera verified, fails (with the new code)
  without it, still succeeds with the screen also verified; retries listed above; wrong-project and cross-kind
  access denied; no token or signed URL in any log line.
* Docs: update `docs/data-model.md` (required kinds, statuses), `docs/security.md`, a new ADR in
  `docs/decisions.md` for `REQUIRED_RECORDING_KINDS`, and `docs/onboarding.md` if the Storage/CORS setup changes.

When done, report which checks you ran (and which you could not, for example anything needing Docker), and hand
the updated contract back to Track A for review before any `x-status` is changed to `confirmed`.
