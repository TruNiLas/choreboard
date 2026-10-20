import Link from "next/link";
import { logOut } from "@/app/auth-actions";
import { createClient, getUserId } from "@/lib/supabase/server";

// Shown on every page. The logout button must be visible on every page while logged in.
export async function SiteHeader() {
  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href={signedIn ? "/app" : "/"} className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-board font-mono text-sm text-board-highlight">
            C
          </span>
          Choreboard
        </Link>
        {signedIn ? (
          <form action={logOut}>
            <button
              type="submit"
              data-testid="logout"
              className="min-h-11 rounded-lg px-3 text-sm font-medium text-muted hover:text-foreground"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link href="/login" className="flex min-h-11 items-center px-3 text-sm font-medium text-muted hover:text-foreground">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
