# Project Guidelines

## Stack and Structure

- This is a React and TypeScript application built with Vite.
- Application code lives in `src/`: pages in `src/pages/`, reusable components in `src/components/`, hooks in `src/hooks/`, and shared utilities in `src/lib/`.
- Landing-page sections live in `src/components/landing/`; reusable shadcn-style UI primitives live in `src/components/ui/`.
- Routes and app-level providers are configured in `src/App.tsx`; the app entry point and global styles are in `src/main.tsx` and `src/index.css`.
- Use the `@/` alias for imports from `src/`.
- Reuse existing components and Tailwind/CSS patterns before introducing new dependencies or styling conventions.

## Product and Demo Boundaries

- The routes are `/`, `/test`, `/results/:id`, `/privacy-policy`, `/login`, `/auth/callback`, `/logout`, and `/admin/*`; see [README.md](./README.md) for their descriptions and project commands.
- This is a frontend demo. Results are hard-coded, the recording upload progress is simulated, and survey/recording data is not persisted or sent to a backend.
- Supabase Auth is used only for the `/admin` area (email and password; sign-up is disabled in Supabase). Only `src/lib/supabase.ts` and `src/lib/auth.ts` import `@supabase/supabase-js`; components use the `useAuth` hook. Auth routes are lazy-loaded so public pages never load Supabase code. Never put a `service_role` key in `VITE_*` variables or the repo.
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
