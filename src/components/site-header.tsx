import Link from "next/link";
import { logOut } from "@/app/auth-actions";
import { createClient, getUserId } from "@/lib/supabase/server";

// Shown on every page. The logout button must be visible on every page while logged in.
export async function SiteHeader() {
  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href={signedIn ? "/app" : "/"} className="flex min-h-11 items-center gap-2 text-lg font-medium tracking-tight">
          <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" className="text-accent">
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path
              d="M7 12.5l3.2 3.2L17 8.5"
              fill="none"
              stroke="var(--accent-foreground)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          choreboard
        </Link>
        {signedIn ? (
          <form action={logOut}>
            <button
              type="submit"
              data-testid="logout"
              className="min-h-11 rounded-md px-3 text-muted hover:text-foreground"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link href="/login" className="flex min-h-11 items-center px-3 text-muted hover:text-foreground">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
