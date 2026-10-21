import Link from "next/link";
import { Dock } from "@/components/landing/dock";
import { MonthStory } from "@/components/landing/month-story";
import { LogoMark } from "@/components/logo";
import { FORFEIT_PRESETS } from "@/lib/presets";
import { createClient, getUserId } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));

  return (
    <>
      {/* The tile grid runs under the header too, so the hero fills the first screen. */}
      <main className="tile-grid -mt-18 flex-1 pt-18">
        <MonthStory signedIn={signedIn} />

        <section className="bg-accent text-accent-foreground" aria-labelledby="forfeit-title">
          <div className="mx-auto max-w-[80rem] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
            <h2 id="forfeit-title" className="max-w-[16ch] font-display text-[3.5rem] sm:text-[5.5rem]">
              Pick a forfeit worth avoiding.
            </h2>
            <p className="mt-5 max-w-[34rem] text-lg sm:text-xl">
              Choose one together or write your own. It sits under the scoreboard all month, right where everyone can
              see it.
            </p>
            <ul className="mt-12 flex flex-wrap gap-4">
              {FORFEIT_PRESETS.map((forfeit, index) => (
                <li
                  key={forfeit}
                  className="rounded-[14px] border-2 border-dashed border-accent-foreground/40 bg-background px-5 py-4 font-display text-[1.75rem] text-foreground"
                  style={{ transform: `rotate(${[-1.5, 1, -0.5, 1.5, -1][index % 5]}deg)` }}
                >
                  {forfeit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-board text-board-foreground" aria-labelledby="closing-title">
          <div className="tile-grid-board">
            <div className="mx-auto flex max-w-[80rem] flex-col items-center px-4 py-24 text-center sm:px-8 sm:py-32 lg:px-12">
              <LogoMark className="size-16" />
              <h2 id="closing-title" className="mt-8 max-w-[14ch] font-display text-[3.5rem] sm:text-[5.5rem]">
                Get your flat on the board.
              </h2>
              <p className="mt-5 max-w-[30rem] text-lg text-board-muted">
                Sign up, share the link in your flat&rsquo;s group chat, and the race starts today.
              </p>
              <Link id="closing-cta" href={signedIn ? "/app" : "/signup"} className="btn btn-primary mt-10 min-h-14 px-8 text-lg">
                {signedIn ? "Open your board" : "Sign up free"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-board text-board-muted">
        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-4 border-t border-board-line px-4 py-8 text-sm sm:px-8 lg:px-12">
          <span className="font-display text-xl text-board-foreground">Choreboard</span>
          <span>A student project from IE University, Madrid.</span>
        </div>
      </footer>

      <Dock signedIn={signedIn} />
    </>
  );
}
