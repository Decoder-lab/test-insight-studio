# Onboarding

## Prerequisites

* Node.js 20+ and npm (only used as a task runner and to install pinned tools).
* **Docker** running (the local Supabase stack and `npm run test:db` need it).
* Nothing else to install: the Supabase CLI, Deno and the OpenAPI linter are pinned devDependencies.

```bash
npm ci
cp supabase/functions/.env.example supabase/functions/.env   # no secrets inside
```

## Everyday commands

| Task | Command |
| --- | --- |
| Start / stop local Supabase | `npm run supabase:start` / `npm run supabase:stop` |
| Check local environment (URLs, keys) | `npm run supabase:status` |
| Reset local DB (migrations + seed) | `npm run supabase:reset` |
| Serve Edge Functions with hot reload | `npm run functions:serve` |
| Edge Function / contract / migration-structure tests | `npm run test:functions` |
| Database (pgTAP) tests | `npm run test:db` (needs local Supabase running) |
| Validate the OpenAPI contract | `npm run lint:contract` |
| Format / check formatting | `npm run format` / `npm run format:check` |
| Lint, type-check | `npm run lint` · `npm run check:types` |
| Everything that needs no Docker | `npm run check` |
| Lint the database schema | `npm run lint:db` (needs local Supabase running) |
| New migration | `npx supabase migration new <snake_case_name>` |

Local URLs after `supabase:start`: API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`.
Function endpoints: `http://127.0.0.1:54321/functions/v1/admin-api/...` and `.../respondent-api/...`.
`npm run supabase:status` prints the local publishable/anon and secret keys; they are local-only
defaults, never reuse them elsewhere.

### Local administrator

Public signup is disabled, so create the account in Studio (Authentication → Users → Add user), then
make it an administrator in Studio's SQL editor (replace the address with the one you created):

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'you@example.com';
```

The hosted project works the same way (dashboard → Authentication → Users, then the SQL editor). Only
people who may use the admin panel belong in `admin_users`; removing the row revokes access
immediately, because `admin-api` checks the table on every request.

### Known local quirks

* `Skipping migration .gitkeep...` on start/reset is harmless; the file only keeps the empty directory in Git.
* The local gateway answers CORS itself with `Access-Control-Allow-Origin: *`, so the `ALLOWED_ORIGINS`
  allowlist is not observable locally (security.md, "Local caveat"). Do not "fix" the function to match.
* The first `supabase:start` pulls several GB of images; subsequent starts are fast.
* `supabase:start` prints local demo keys. They are public defaults of the CLI, not secrets, but still
  do not paste them into issues or docs.

## Frontend integration requirements (for Track A)

Everything below is public information; the frontend never needs a secret.

| Need | Value / source |
| --- | --- |
| Supabase project URL | Dashboard → Project Settings → API (public) |
| Publishable (anon) API key | Same page. Safe for browsers. **Never** ship the secret/service-role key. |
| Admin endpoints | `<URL>/functions/v1/admin-api/...` |
| Respondent endpoints | `<URL>/functions/v1/respondent-api/...` |
| Admin auth | Existing Supabase Auth session: `Authorization: Bearer <session.access_token>` (+ `apikey`, sent by supabase-js) |
| Respondent auth | `X-Invitation-Token: <token>` (+ `apikey`) |
| Contract | [contracts/openapi.yaml](../contracts/openapi.yaml) (see architecture.md §6) |
| CORS | Your exact origin(s) must be in the backend secret `ALLOWED_ORIGINS` |
| Recording uploads | `POST /recordings/{kind}/upload-url` → `supabase.storage.from(bucket).uploadToSignedUrl(path, token, blob, { contentType })` → `POST /recordings/{kind}/verify` |

Frontend constraints that protect the backend limits: stop recording at 120 s; set
`videoBitsPerSecond` so a 120 s file stays well under 50 MB; upload with a bare content type such as
`video/webm`; keep the invitation token out of logs/analytics/query strings.

## Configuration reference

### Supabase Edge Function secrets (hosted: `npx supabase secrets set NAME=value`)

| Name | Purpose | Notes |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | CORS allowlist (comma-separated exact origins) | Required. Empty = browsers blocked. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` | Database/Auth/Storage access | **Injected automatically** by Supabase. Do not set them. |

Locally, put `ALLOWED_ORIGINS` in `supabase/functions/.env` (git-ignored; see `.env.example`).

### GitHub Actions

The current CI needs **no secrets** (it only uses the local Supabase stack). If a deployment workflow
is added later (requires an ADR and approval), it will need these repository/environment secrets,
set by a repository admin: `SUPABASE_ACCESS_TOKEN` (personal access token), `SUPABASE_DB_PASSWORD`,
and the project ref as a variable (`SUPABASE_PROJECT_REF`). Use GitHub *Environments* with required
reviewers for production. Never print them in logs.

## Deploying (manual, needs explicit approval)

Nothing deploys automatically. After a reviewed PR is merged, an authorised person runs:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push --dry-run         # review, then run without --dry-run
npx supabase secrets set ALLOWED_ORIGINS=https://<frontend-origin>
npx supabase functions deploy admin-api
npx supabase functions deploy respondent-api   # verify_jwt comes from config.toml
```

Also check, in the dashboard, settings that `config.toml` only controls locally: **Auth → signups
disabled, anonymous sign-ins disabled**; Storage bucket `recordings` private with a 50 MB limit;
Data API exposure of new tables (ADR-010). Do not use `supabase config push` without review: it
overwrites hosted Auth/Storage settings.

## Suggested first tasks

* **Track A:** review `contracts/openapi.yaml` (answer Q3, Q4), generate TS types from it, build the
  API client, and run an upload spike with real `MediaRecorder` output (Q7, bitrate cap).
* **Track B:** migrations 1-6 from data-model.md with pgTAP tests; real token verification in
  `respondent-api` and admin verification in `admin-api`; then invitations, then uploads/verify,
  then `complete_project` + `ProjectReady`.
* **Track C:** resolve Q1/Q2/Q12/Q13; make `npm run supabase:start` + `test:db` + CI green on a real
  runner; create the hosted project settings checklist; add CODEOWNERS and branch protection.
