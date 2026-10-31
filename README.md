# Decoder PMF Test Demo

A frontend prototype for a product-market-fit (PMF) landing-page research flow. It presents a marketing site, guides a participant through pre- and post-test surveys and a browser-based recording interface, and shows a sample results dashboard.

## Status and scope

This repository currently contains a client-side demo, not a production research or analytics service:

- The test page embeds `https://example.com` and records webcam, microphone, and (when shared) screen media in the browser. The browser asks the participant for permissions.
- The recording screen's upload progress is simulated. No recording or survey data is sent to a server or saved as a test session.
- The results dashboard uses hard-coded sample scores, moments, and recommendations; the URL's session ID is displayed but does not load session data.
- The results page's Download PDF, Share Results, and Book a Call controls are visual demo buttons and are not wired up.

Do not treat demo results as analysis of participant or product data. Backend storage, real upload and processing, and production results integrations are not implemented.

The one exception is team sign-in: the `/admin` area uses [Supabase Auth](https://supabase.com/docs/guides/auth) (email and password). Nothing else in the app talks to Supabase.

## Getting started

Requirements: Node.js and npm.

```sh
npm ci
cp .env.example .env.local   # then fill in the Supabase values (see below)
npm run dev
```

Vite serves the development app on port `8080`. Use the printed local URL to open it in a browser. The recording flow requires a browser that supports `getUserMedia`, `getDisplayMedia`, and `MediaRecorder`; camera, microphone, and screen capture are subject to browser permissions and user selection.

## Authentication

Sign-in is only needed for `/admin`; the landing page, `/test`, `/results/:id` and `/privacy-policy` are public. Public sign-up is disabled in Supabase, so accounts are created by an administrator in the Supabase dashboard (Authentication → Users). Any signed-in user can open `/admin`. The route guard only controls the UI, so any admin data added later must be protected with row-level security.

Environment variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon / publishable key. Never use the `service_role` key here |

- Locally, put them in `.env.local` (git-ignored). Without them the app still runs, but `/login` shows "Authentication is not configured for this build."
- For the GitHub Pages deploy, add both as repository secrets with the same names; `.github/workflows/deploy.yml` passes them to the build step.
- In Supabase → Authentication → URL Configuration, the Site URL and Redirect URLs must include `https://pmf.decoder.digital` and `http://localhost:8080` (plus their `/auth/callback` paths).

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page with product overview, sample content, pricing, FAQ, consultation link, and cookie consent banner |
| `/test` | Demo flow: pre-test survey, recording interface, and post-test survey |
| `/results/:id` | Static sample results dashboard; displays the route parameter as the session ID |
| `/privacy-policy` | Privacy policy page |
| `/login` | Email and password sign-in for the admin area; returns to the originally requested page |
| `/auth/callback` | Completes sign-in from Supabase email links (invite, recovery); shows an error for invalid or expired links |
| `/logout` | Signs out and redirects to `/login` |
| `/admin/*` | Admin area (requires sign-in; currently an empty access-management placeholder) |
| Other paths | Not-found page |

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run build:dev` | Build using Vite's development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

Vitest uses jsdom and discovers `*.test.*` and `*.spec.*` files under `src/`.

## Project structure

```text
src/
  components/
    auth/      Auth provider, context and route guard
    landing/   Landing-page sections
    ui/        Reusable shadcn-style UI components
    *.tsx      Survey, recording, and shared components
  hooks/       Shared React hooks
  lib/         Utilities, cookie-consent helpers, Supabase client and auth adapter
  pages/       Route-level page components
  test/        Vitest setup and tests
  App.tsx      Providers and route definitions
  main.tsx     Application entry point
```

The `@/` import alias points to `src/`. Vite and Vitest configuration live in `vite.config.ts` and `vitest.config.ts`.
