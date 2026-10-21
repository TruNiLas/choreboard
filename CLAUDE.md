@AGENTS.md

## Grading contract — EdTech Challenge (never remove or break this)
An automated bot grades this app on its public Vercel URL, acting like a stranger.

### Pages
- `/` public landing page (no login needed): what the app does, who it is for, and one button to sign up.
- `/signup` sign-up with email + password. `/login` login with email + password.
- `/app` the main feature, only for logged-in users.
- After sign-up and after login, send the user to `/app`.
- No email confirmation, no CAPTCHA, no "Google only" login, no mandatory onboarding before `/app`.

### data-testid attributes (exact names, do not translate)
- Sign-up form: `signup-email`, `signup-password`, `signup-submit`
- Login form: `login-email`, `login-password`, `login-submit`
- `logout`: the logout button, visible on every page of a logged-in user
- On `/app`:
  - `core-input`: a TEXT field of the main feature (type="text" or a textarea, e.g. the title or description, never a number or date picker). The bot types a short text like "QA-7F3K2A grading bot test"
  - `core-submit`: the button that saves it
  - `core-item`: EVERY saved item in the list, showing the text typed in `core-input`
- Typing only in `core-input` and clicking `core-submit` must save a new item. Any other field needs a valid default value.

### Data and security
- Use Supabase Auth (email + password) and save all data in Supabase tables, never only in the browser (no localStorage for user data).
- Row Level Security ON for every table, with policies based on `auth.uid()`. Nobody can read anything without logging in.
- Only the Supabase URL and the publishable (anon) key may reach the browser. Never put the secret/service_role key or any AI API key in the frontend or in GitHub.
- Keep keys in `.env.local` (listed in `.gitignore`) and in Vercel environment variables.

## Project: Choreboard

- One-liner (draft): Choreboard helps students in shared flats get credit for every chore,
  so the work stays fair and the month's laziest flatmate cooks dinner.
- Who: university students sharing a flat (first users: IE students in Madrid).
- Problem (from interviews): small chores get skipped, nobody brings them up, rules agreed
  at move-in fade without consequences, and it builds up into fights.
- Tone: positive. Credit for what got done, never blame for what did not.
- Main feature: log a chore that got done (`core-input` = what got done, e.g. "Did the
  dishes"). "Who did it" defaults to me; picking a flatmate credits them ("thanked by").
- Data: shared only within a flat. A new user gets their own flat at sign-up, so a
  stranger sees nothing. In Socratista: "Data shared between users: no".

### v1 scope

1. A flat is created automatically at sign-up (no onboarding before `/app`). Flatmates
   join with an invite link (`/join/<code>`) or by typing the 6-character code on `/app`.
2. Log a chore: text, who did it (default me). Points come from English and Spanish
   keyword groups (bathroom 3, kitchen clean 3, floors/cooking/shopping 2); anything else
   is 1 point. The same chore counts once per person per day (a repeat saves for 0).
   Points are set in the database, never trusted from the browser; the form previews them.
   The logger can remove an entry for 24 hours; a kudos can be declined by its recipient.
   Forfeit changes are recorded and shown in the feed.
3. This month's leaderboard plus the flat's forfeit (picked from presets or typed). The
   lowest score at month end does the forfeit.

Scoring lives in `supabase/schema.sql` (`chore_words`, `chore_category`, `chore_points`)
and is mirrored in `src/lib/points.ts` for the preview; keep both in sync. Quick-pick
titles live in `src/lib/presets.ts` and take their points from `points.ts`.

v2, not now: doubting a self-report, custom points confirmed by flatmates, backdating, reminders by email, nudges, assigned chores,
leaving a flat, editing display names.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase via `@supabase/ssr`. Code on a
public GitHub repo, deployed on Vercel. No other services and no extra dependencies
unless asked.

If the installed Next.js is newer than you know, read `node_modules/next/dist/docs/`
before writing code. APIs and file conventions may have changed.

## Implementation rules

- Login uses `supabase.auth.signInWithPassword`, sign-up uses `supabase.auth.signUp`.
  Show the Supabase error message on failure.
- If `signUp` returns no session, "Confirm email" is still on in Supabase. Show an error
  that says so. Never show a "check your email" screen.
- Protect `/app` on the server: no session means redirect to `/login`. A logged-in user
  who opens `/login` or `/signup` goes to `/app`.
- The `logout` button lives in a shared header, so it is on every page while logged in,
  including `/`.
- The schema lives in `supabase/schema.sql`. Every table has RLS enabled and policies
  `to authenticated` only, all based on `auth.uid()`: either the row's own `user_id`, or
  membership of the same flat through `public.my_flat_id()`. No policies and no grants
  for `anon`. "Automatically expose new tables" is off, so every table needs explicit
  grants to `authenticated`.
- Joining a flat and creating one at sign-up go through `security definer` functions,
  never through direct writes to `flats` or `flat_members` from the browser.
- All reads and writes go through the logged-in user's session. Never a service key.
- Every account is treated the same. No special cases for test or bot accounts.
- Mobile first: no horizontal scroll at 375px wide, tap targets at least 44px.
- Commit after each working step. Never commit `.env.local`. Do not push unless asked.
