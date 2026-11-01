# Project Guidelines

## Stack and Structure

- This is a React and TypeScript application built with Vite.
- Application code lives in `src/`: pages in `src/pages/`, reusable components in `src/components/`, hooks in `src/hooks/`, and shared utilities in `src/lib/`.
- Landing-page sections live in `src/components/landing/`; reusable shadcn-style UI primitives live in `src/components/ui/`.
- Routes and app-level providers are configured in `src/App.tsx`; the app entry point and global styles are in `src/main.tsx` and `src/index.css`.
- Use the `@/` alias for imports from `src/`.
- Reuse existing components and Tailwind/CSS patterns before introducing new dependencies or styling conventions.

## Product and Demo Boundaries

- The routes are `/`, `/test`, `/results/:id`, `/privacy-policy`, `/login`, `/auth/callback`, `/logout`, and `/admin/*`, plus the dev-only `/dev/test-demo`; see [README.md](./README.md) for their descriptions and project commands.
- `/test` is the respondent entry (`/test#invite=<token>`) and is currently a placeholder page: it validates the invitation through the backend's `respondent-api` (`src/lib/respondent-api/`) and shows the project details the backend returns, and the rest of the respondent flow is not built yet. The old demo flow (`src/pages/TestPage.tsx`) is only routed at `/dev/test-demo` in development, for review while its pieces are reused for the respondent flow.
- The public pages are a frontend demo. Results are hard-coded, the recording upload progress is simulated, and survey/recording data is not persisted or sent to a backend. Only `/admin` and the invitation check on `/test` talk to a backend.
- Supabase Auth is used only for the `/admin` area (email and password; sign-up is disabled in Supabase). Only `src/lib/supabase.ts` and `src/lib/auth.ts` import `@supabase/supabase-js`; components use the `useAuth` hook. Auth routes and `/test` are lazy-loaded so the landing page never loads Supabase code. `/test` uses no Supabase Auth: respondents have no account and send only the invitation token (`X-Invitation-Token`). Never put a `service_role` key in `VITE_*` variables or the repo.
- The `/admin` pages call the backend's `admin-api` Edge Function through `src/lib/admin-api/` (typed client over `invokeFunction` in `src/lib/supabase.ts`). The contract is `contracts/openapi.yaml`: do not invent endpoints or fields, and do not edit the contract from here; raise needed changes instead. Branch on `error.code`, never on `error.message`. The backend may not be deployed, so show a "backend not ready" state rather than faking responses; `VITE_ADMIN_API_MOCK` (dev only, `src/lib/admin-api/mock.ts`) is the only sample data.
- The invitation token is a password: keep it only in component state while its dialog is open, and never write it to storage, logs, a query string or the react-query cache (see `useIssueInvitation`). On `/test` it is read from the URL fragment and held only in memory (see `useInvitationProject`, which deliberately avoids react-query); `useInvitationToken` removes the fragment from the address bar right after reading it, as the contract requires, so a refresh needs the link to be reopened.
- Keep demo behavior clearly distinguished from real analysis or data handling. Do not describe mock results as participant data.
- The recording flow uses browser camera, microphone, and screen-capture APIs. Preserve permission handling and stop media tracks during cleanup when changing it.

## Development and Validation

- Start the development server with `npm run dev`.
- Run the production build with `npm run build`.
- Run linting with `npm run lint`.
- Run Vitest with `npm test`; tests are configured for jsdom and live under `src/` with `*.test.*` or `*.spec.*` names.
- Run the relevant validation commands after changing code. Do not claim a check passed unless it was run.

## Conventions

- Follow the existing TypeScript and React patterns in neighboring files.
- Keep changes focused, and add or update tests when changing behavior; avoid broad tests that only assert a constant.
- Do not edit dependency lockfiles by hand.
