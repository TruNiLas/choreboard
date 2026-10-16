# Build prompt (Step 5)

Fill in the two TODO lines, then paste everything below the line into Claude Code,
started inside this folder. Run the SQL in Supabase when it asks.

---

Read CLAUDE.md and follow the grading contract and the implementation rules exactly.
This folder already has CLAUDE.md, PROMPT.md, .gitignore and .env.local (my Supabase
URL and publishable key). Keep them and build the Next.js app around them.

Build a Next.js web app connected to my Supabase project.
One-liner: TODO "[App name] helps [who] [do what] so they [result]."
Main feature on /app: TODO e.g. "add a deadline with a title".
Data: private, each user only sees their own items.

1. Landing page at `/`: one headline that says who it is for and what they get, one
   short subheadline, one "Sign up" button, and a small "Log in" link. A stranger must
   understand it in 5 seconds.
2. `/signup`, `/login` and `/app` with Supabase Auth (email + password), following the
   data-testid rules. A wrong password shows an error.
3. On `/app`: typing only in `core-input` and clicking `core-submit` saves a new item;
   every other field has a default. The list shows every item as `core-item`, newest
   first, and it is not empty-looking on first visit (a short hint when there are no
   items).
4. Write the SQL in `supabase/schema.sql` and tell me exactly where to paste it in
   Supabase. Wait until I confirm I ran it.
5. Every page works on a phone: no horizontal scroll at 375px.
6. Before saying it is done: run the build and lint, start the dev server and check it
   yourself: sign up, land on `/app`, add an item, log out, wrong password rejected, log
   back in and the item is still there, a second account does not see it, and `/app`
   redirects to `/login` when logged out. Tell me what you could not check.
7. Commit after each working step. Do not create the GitHub repo or push yet.

When you finish, tell me how to run it on my laptop.
