# Supabase Auth: invite-only access

How to add Supabase Auth so that only pre-approved accounts can sign in, and `/test` and everything under it requires login.

## Access rules

| Route | Access |
| --- | --- |
| `/` | Public |
| `/privacy-policy` | Public |
| `*` (Not Found) | Public |
| `/login`, `/auth/callback` | Public (needed to sign in) |
| `/test` and everything under it (including `/results/:id`) | Signed-in **and** approved users only |

Two layers enforce this:

1. **Supabase Auth** has public sign-ups disabled, so only accounts an admin invites can exist.
2. **An approval table (`team_members`)** is checked after login. A user who exists in Supabase Auth but is not in the table is signed out and denied.

> **Conflict with the existing spec:** [Decoder_MVP_DevF.md](./Decoder_MVP_DevF.md) plans `/test#invite=TOKEN` as the respondent flow (task B-1) and protects only `/results/:id` and `/admin` (task B-8). If external respondents must still reach `/test` through an invite token, they cannot also be required to log in. Decide this before implementing: either keep `/test` token-based for respondents, or protect it as described here.

## 1. Configure the Supabase project

In the Supabase Dashboard:

1. **Authentication → Providers → Email**: enable Email sign-in and **disable sign-ups** ("Allow new users to sign up" off).
2. **Authentication → URL Configuration**:
   - Site URL: your production URL (for example `https://pmf.decoder.digital`).
   - Redirect URLs: add the production URL and `http://localhost:8080` (plus `/auth/callback` variants if you use a dedicated callback route).
3. **Authentication → SMTP**: configure custom SMTP before inviting many users. The built-in mailer has a low sending limit.
4. **Authentication → Users → Invite user**: invite each approved person by email. Invitations bypass the disabled sign-up setting.

## 2. Create the approval table

Run in the SQL Editor (or a migration):

```sql
create table if not exists team_members (
  user_id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  role text not null default 'member'
);

alter table team_members enable row level security;

-- A signed-in user may read only their own approval row.
create policy "read own membership"
  on team_members for select
  to authenticated
  using (user_id = auth.uid());
```

No insert/update/delete policies are defined, so the browser cannot approve anyone. Admins manage rows from the Dashboard or SQL Editor.

If `team_members` already exists from the spec's migration, reuse it and only ensure the select policy above exists. Adjust the `role` check to match the spec's roles.

Approve an invited user (after the invite has been sent):

```sql
insert into team_members (user_id, email)
select id, email from auth.users where email = 'person@example.com';
```

To revoke access, delete the row and, if needed, remove or ban the user under Authentication → Users.

## 3. Add the client

Install the library:

```sh
npm install @supabase/supabase-js
```

Add environment variables (see `.env.example` as per task A-6 in the spec; do not commit real `.env` values):

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon or publishable key>
```

Only the anon/publishable key belongs in the frontend. **Never** put the `service_role` key in frontend code, `VITE_*` variables, or the repository. Data access is protected by RLS, not by hiding the anon key.

Create `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

For production builds on GitHub Pages, pass both variables as secrets to the build step in `.github/workflows/`.

## 4. Auth state and approval check

Create an `AuthProvider` (for example `src/lib/auth.tsx`) that:

- Reads the session with `supabase.auth.getSession()` on startup.
- Subscribes with `supabase.auth.onAuthStateChange` and unsubscribes on cleanup.
- After a session exists, checks approval:

  ```ts
  const { data } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();
  ```

  If there is no row, call `supabase.auth.signOut()` and expose a "not approved" state.
- Exposes `session`, `user`, `isApproved`, `loading`, and `signOut`.

Keep `loading` true until both the session and the approval check finish, so protected content never flashes and approved users are not redirected prematurely.

Wrap the app with the provider inside `BrowserRouter` in [App.tsx](../src/App.tsx).

## 5. Login page

Add a public `/login` page with a validated email field (the project already uses `react-hook-form` and `zod`). Use a magic link that **cannot create new accounts**:

```ts
await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

Notes:

- Do not offer a "Sign up" form. Show a neutral message such as "If this email is approved, a sign-in link has been sent" so the page does not reveal which emails are approved.
- Password login is an alternative: invited users set a password from the invite link, then use `signInWithPassword`. Choose one method and keep it consistent.
- Handle expired or invalid links with a clear error and a way to request a new one.

Add `/auth/callback` to complete the redirect (the Supabase client detects the session from the URL), then navigate to the originally requested page or `/test`.

## 6. Protect the routes

Create a `ProtectedRoute` wrapper:

- While `loading`, render a loading state.
- If there is no session or the user is not approved, redirect to `/login`, passing the requested location so the user returns there after login.
- Otherwise render the child routes.

Only allow internal return paths (a path starting with a single `/`); ignore anything else to prevent open redirects.

Update the routes in [App.tsx](../src/App.tsx):

```tsx
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
  <Route path="/login" element={<Login />} />
  <Route path="/auth/callback" element={<AuthCallback />} />

  <Route element={<ProtectedRoute />}>
    <Route path="/test" element={<TestPage />} />
    <Route path="/results/:id" element={<ResultsPage />} />
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
```

If more pages are added under `/test`, nest them inside the protected group.

The landing page links to `/test` from several places (hero, navbar, pricing, FAQ, sticky CTA). These keep working: signed-out visitors land on `/login` first. Consider wording the CTAs so visitors know access is invite-only, and add a sign-out control for signed-in users.

## 7. Backend security

A route guard only controls the UI. When survey answers, recordings, or results are stored in Supabase, protect them with RLS policies and private Storage buckets that allow access only to approved users, for example:

```sql
exists (select 1 from team_members where user_id = auth.uid())
```

Without this, anyone with the public anon key could call the API directly.

## 8. GitHub Pages notes

The app is a single-page app on GitHub Pages (`public/404.html` and the `spa_redirect` script in `index.html` restore deep links). Verify that `/login` and `/auth/callback` survive that redirect, including the query string or hash Supabase appends to the callback URL, and that the production domain is in the Supabase Redirect URLs.

## 9. Verify

- Signed out: `/`, `/privacy-policy`, and an unknown path load; `/test` and `/results/demo-session` redirect to `/login`.
- Invited and approved user: receives the link, signs in, lands on the requested page, stays signed in after refresh, and can sign out.
- Email not invited: no account is created, and no access is granted.
- Invited but removed from `team_members`: signed out and denied.
- Expired or reused link shows an error.
- Direct API call with only the anon key cannot read protected tables.
- `npm run lint`, `npm test`, and `npm run build` pass; add tests for `ProtectedRoute` (loading, signed out, unapproved, approved).
