import Link from "next/link";
import { logOut } from "@/app/auth-actions";
import { Logo } from "@/components/logo";
import { createClient, getUserId } from "@/lib/supabase/server";

// Shown on every page. The logout button must be visible on every page while logged in.
export async function SiteHeader() {
  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));

  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-18 max-w-[80rem] items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
        <Link href={signedIn ? "/app" : "/"} className="flex min-h-11 items-center" aria-label="Choreboard home">
          <Logo />
        </Link>
        {signedIn ? (
          <form action={logOut}>
            <button
              type="submit"
              data-testid="logout"
              className="min-h-11 rounded-full px-4 font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-full px-4 font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
