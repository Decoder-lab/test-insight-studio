import { beforeEach, describe, expect, it, vi } from "vitest";

const lib = vi.hoisted(() => ({ invokeFunction: vi.fn(), uploadToSignedUrl: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ invokeFunction: lib.invokeFunction, uploadToSignedUrl: lib.uploadToSignedUrl }));

import { respondentApi } from "./client";
import { RespondentApiError, describeRespondentError, isRetryable } from "./errors";
import type { QuestionnaireAnswers, UploadUrl } from "./types";

const TOKEN = "SECRET-TOKEN";

const project = () => ({
  id: "p1",
  name: "Pilot test",
  status: "READY",
  limits: { maxDurationSeconds: 120, maxSizeBytes: 52428800, allowedContentTypes: ["video/webm"] },
  progress: { questionnaireSubmitted: false, recordings: { camera: "NOT_STARTED", screen: "NOT_STARTED" } },
});

const envelope = (code: string, message = "server text") => ({ error: { code, message } });
const respond = (status: number, body: unknown = null) => lib.invokeFunction.mockResolvedValueOnce({ status, body });

const failure = async (call: () => Promise<unknown> = () => respondentApi.validateInvitation(TOKEN)) => {
  const error = await call().then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(RespondentApiError);
  return error as RespondentApiError;
};

const ANSWERS: QuestionnaireAnswers = {
  preSurvey: { problemToSolve: "Slow onboarding", buyMotivation: "Saves time", budgetRange: "€1-5K", urgency: 4 },
};
const submitFailure = () => failure(() => respondentApi.submitQuestionnaire(TOKEN, ANSWERS));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("validateInvitation", () => {
  it("posts to the contract's path with the token in the header, not in the URL or body", async () => {
    respond(200, project());

    await expect(respondentApi.validateInvitation(TOKEN)).resolves.toEqual(project());

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "POST",
      path: "respondent-api/invitation/validate",
      headers: { "X-Invitation-Token": TOKEN },
    });
  });

  it("treats a malformed success body as unexpected", async () => {
    respond(200, { id: "p1", name: "Pilot test" });

    expect((await failure()).kind).toBe("unexpected");
  });

  it("treats an empty success body as unexpected", async () => {
    respond(200, null);

    expect((await failure()).kind).toBe("unexpected");
  });
});

describe("submitQuestionnaire", () => {
  it("puts the answers to the contract's path with the token in the header, not in the URL or body", async () => {
    respond(200, { submittedAt: "2026-11-01T10:00:00Z" });

    await expect(respondentApi.submitQuestionnaire(TOKEN, ANSWERS)).resolves.toEqual({
      submittedAt: "2026-11-01T10:00:00Z",
    });

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "PUT",
      path: "respondent-api/questionnaire-response",
      headers: { "X-Invitation-Token": TOKEN },
      body: { answers: ANSWERS },
    });
  });

  it.each([null, {}, { submittedAt: 123 }])("treats the success body %j as unexpected", async (body) => {
    respond(200, body);

    expect((await submitFailure()).kind).toBe("unexpected");
  });

  it.each([
    [400, envelope("validation_error"), "validation"],
    [409, envelope("conflict"), "conflict"],
    [401, envelope("invalid_invitation"), "invalid"],
    [410, envelope("invitation_revoked"), "revoked"],
    [410, envelope("invitation_expired"), "expired"],
    [429, envelope("rate_limited"), "rate_limited"],
    [501, envelope("not_implemented"), "not_ready"],
    [404, null, "not_ready"],
    [500, envelope("internal_error"), "unexpected"],
    [0, null, "network"],
  ])("maps status %d with %j to %s", async (status, body, kind) => {
    respond(status, body);

    const error = await submitFailure();

    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
  });

  it("does not take a bare 400 or 409 from the platform for a rejected submission", async () => {
    respond(400, null);
    expect((await submitFailure()).kind).toBe("unexpected");

    respond(409, null);
    expect((await submitFailure()).kind).toBe("unexpected");
  });
});

const UPLOAD_URL: UploadUrl = {
  bucket: "recordings",
  path: "p1/camera/r1.webm",
  token: "UPLOAD-TOKEN",
  signedUrl: "https://storage.example/upload/sign/recordings/p1/camera/r1.webm?token=UPLOAD-TOKEN",
  maxSizeBytes: 52428800,
  maxDurationSeconds: 120,
};

describe("createUploadUrl", () => {
  it("posts the bare content type to the kind's path with the token in the header only", async () => {
    respond(200, UPLOAD_URL);

    await expect(respondentApi.createUploadUrl(TOKEN, "camera", "video/webm")).resolves.toEqual(UPLOAD_URL);

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "POST",
      path: "respondent-api/recordings/camera/upload-url",
      headers: { "X-Invitation-Token": TOKEN },
      body: { contentType: "video/webm" },
    });
  });

  it("uses the path of the kind it is asked for", async () => {
    respond(200, UPLOAD_URL);

    await respondentApi.createUploadUrl(TOKEN, "screen", "video/mp4");

    expect(lib.invokeFunction).toHaveBeenCalledWith(
      expect.objectContaining({ path: "respondent-api/recordings/screen/upload-url", body: { contentType: "video/mp4" } }),
    );
  });

  it.each([null, {}, { ...UPLOAD_URL, token: undefined }, { ...UPLOAD_URL, maxSizeBytes: "50" }])(
    "treats the success body %j as unexpected",
    async (body) => {
      respond(200, body);

      expect((await failure(() => respondentApi.createUploadUrl(TOKEN, "camera", "video/webm"))).kind).toBe("unexpected");
    },
  );

  it.each([
    [409, envelope("conflict"), "conflict"],
    [400, envelope("validation_error"), "validation"],
    [429, envelope("rate_limited"), "rate_limited"],
    [501, envelope("not_implemented"), "not_ready"],
    [410, envelope("invitation_revoked"), "revoked"],
  ])("maps status %d with %j to %s", async (status, body, kind) => {
    respond(status, body);

    expect((await failure(() => respondentApi.createUploadUrl(TOKEN, "camera", "video/webm"))).kind).toBe(kind);
  });
});

describe("uploadRecording", () => {
  const blob = new Blob(["video"], { type: "video/webm" });

  it("sends the file to Storage with the signed token and the bare content type", async () => {
    lib.uploadToSignedUrl.mockResolvedValueOnce({ ok: true, status: 200 });

    await respondentApi.uploadRecording(UPLOAD_URL, blob, "video/webm");

    expect(lib.uploadToSignedUrl).toHaveBeenCalledWith({
      bucket: "recordings",
      path: "p1/camera/r1.webm",
      token: "UPLOAD-TOKEN",
      blob,
      contentType: "video/webm",
    });
    expect(lib.invokeFunction).not.toHaveBeenCalled();
  });

  it.each([0, 413, 415, 500])("reports a Storage failure (status %d) as an upload error, without the upload token", async (status) => {
    lib.uploadToSignedUrl.mockResolvedValueOnce({ ok: false, status });

    const error = await failure(() => respondentApi.uploadRecording(UPLOAD_URL, blob, "video/webm"));

    expect(error.kind).toBe("upload");
    expect(error.status).toBe(status);
    expect(`${error.message} ${describeRespondentError(error)}`).not.toContain("UPLOAD-TOKEN");
  });
});

describe("verifyRecording", () => {
  const VERIFIED = { kind: "camera", status: "VERIFIED", sizeBytes: 1234, contentType: "video/webm" };

  it("posts the client's duration to the kind's path with the token in the header only", async () => {
    respond(200, VERIFIED);

    await expect(respondentApi.verifyRecording(TOKEN, "camera", 4200)).resolves.toEqual(VERIFIED);

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "POST",
      path: "respondent-api/recordings/camera/verify",
      headers: { "X-Invitation-Token": TOKEN },
      body: { durationMs: 4200 },
    });
  });

  it.each([null, {}, { ...VERIFIED, sizeBytes: "1234" }])("treats the success body %j as unexpected", async (body) => {
    respond(200, body);

    expect((await failure(() => respondentApi.verifyRecording(TOKEN, "camera", 1))).kind).toBe("unexpected");
  });

  it.each([
    [400, envelope("validation_error"), "validation"],
    [404, envelope("not_found"), "unexpected"],
    [409, envelope("conflict"), "conflict"],
    [429, envelope("rate_limited"), "rate_limited"],
  ])("maps status %d with %j to %s", async (status, body, kind) => {
    respond(status, body);

    expect((await failure(() => respondentApi.verifyRecording(TOKEN, "camera", 1))).kind).toBe(kind);
  });
});

describe("completeProject", () => {
  it("posts to /complete with the token in the header only", async () => {
    respond(200, { status: "READY", readyAt: "2026-11-01T10:05:00Z" });

    await expect(respondentApi.completeProject(TOKEN)).resolves.toEqual({ status: "READY", readyAt: "2026-11-01T10:05:00Z" });

    expect(lib.invokeFunction).toHaveBeenCalledWith({
      method: "POST",
      path: "respondent-api/complete",
      headers: { "X-Invitation-Token": TOKEN },
    });
  });

  it.each([null, {}, { status: "IN_PROGRESS", readyAt: "2026-11-01T10:05:00Z" }, { status: "READY" }])(
    "treats the success body %j as unexpected",
    async (body) => {
      respond(200, body);

      expect((await failure(() => respondentApi.completeProject(TOKEN))).kind).toBe("unexpected");
    },
  );

  it.each([
    [409, envelope("project_incomplete"), "incomplete"],
    [409, envelope("conflict"), "conflict"],
    [501, envelope("not_implemented"), "not_ready"],
    [0, null, "network"],
  ])("maps status %d with %j to %s", async (status, body, kind) => {
    respond(status, body);

    expect((await failure(() => respondentApi.completeProject(TOKEN))).kind).toBe(kind);
  });

  it("explains an incomplete project without calling it a conflict or showing the server's message", async () => {
    respond(409, envelope("project_incomplete", "camera recording is not VERIFIED"));

    const text = describeRespondentError(await failure(() => respondentApi.completeProject(TOKEN)));

    expect(text).toContain("has not been received yet");
    expect(text).not.toMatch(/can no longer be changed|camera|VERIFIED/);
  });
});

describe("errors", () => {
  it.each([
    [401, envelope("invalid_invitation"), "invalid"],
    [410, envelope("invitation_expired"), "expired"],
    [410, envelope("invitation_revoked"), "revoked"],
    [410, envelope("invitation_started"), "started"],
    [429, envelope("rate_limited"), "rate_limited"],
    [429, null, "rate_limited"],
    [503, envelope("rate_limited"), "rate_limited"],
    [501, envelope("not_implemented"), "not_ready"],
    [404, null, "not_ready"],
    [503, null, "not_ready"],
    [500, envelope("internal_error"), "unexpected"],
    [418, null, "unexpected"],
  ])("maps status %d with %j to %s", async (status, body, kind) => {
    respond(status, body);

    const error = await failure();

    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
  });

  it("reports a request that got no response as a network error", async () => {
    respond(0);

    expect((await failure()).kind).toBe("network");
  });

  it("branches on the envelope's code, never on its message", async () => {
    respond(410, envelope("invitation_expired", "this link was REVOKED"));

    expect((await failure()).kind).toBe("expired");
  });

  it("keeps a real 404 from the function (with an envelope) apart from an undeployed function", async () => {
    respond(404, envelope("not_found"));

    expect((await failure()).kind).toBe("unexpected");
  });
});

describe("describeRespondentError", () => {
  it("never shows the server's message or the token", async () => {
    respond(401, envelope("invalid_invitation", `unknown token ${TOKEN}`));

    const text = describeRespondentError(await failure());

    expect(text).toContain("isn't valid");
    expect(text).not.toContain(TOKEN);
  });

  it("explains a rejected or conflicting submission without the server's message", async () => {
    respond(400, envelope("validation_error", `field problemToSolve is bad, token ${TOKEN}`));
    const rejected = describeRespondentError(await submitFailure());
    respond(409, envelope("conflict", "project is READY"));
    const conflict = describeRespondentError(await submitFailure());

    expect(rejected).toContain("could not be accepted");
    expect(conflict).toContain("can no longer be changed");
    expect(rejected + conflict).not.toMatch(new RegExp(`${TOKEN}|problemToSolve|READY`));
  });

  it("offers a retry only where trying again can help", () => {
    expect(isRetryable(new RespondentApiError("network", 0))).toBe(true);
    expect(isRetryable(new RespondentApiError("rate_limited", 429))).toBe(true);
    expect(isRetryable(new RespondentApiError("unexpected", 500))).toBe(true);
    expect(isRetryable(new RespondentApiError("upload", 0))).toBe(true);
    expect(isRetryable(new RespondentApiError("invalid", 401))).toBe(false);
    expect(isRetryable(new RespondentApiError("expired", 410))).toBe(false);
    expect(isRetryable(new RespondentApiError("revoked", 410))).toBe(false);
    expect(isRetryable(new RespondentApiError("started", 410))).toBe(false);
    expect(isRetryable(new RespondentApiError("not_ready", 501))).toBe(false);
    expect(isRetryable(new RespondentApiError("validation", 400))).toBe(false);
    expect(isRetryable(new RespondentApiError("conflict", 409))).toBe(false);
    expect(isRetryable(new RespondentApiError("incomplete", 409))).toBe(false);
  });
});
