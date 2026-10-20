import Link from "next/link";
import { createClient, getUserId } from "@/lib/supabase/server";

const SAMPLE_BOARD = [
  { name: "Lea", points: 14 },
  { name: "You", points: 11 },
  { name: "Marco", points: 9 },
  { name: "Sam", points: 4, watch: true },
];

const STEPS = [
  { title: "Log what you did", text: "Dishes, bins, bathroom. One tap, and the points land on the board." },
  { title: "Thank who covered for you", text: "Forgot your dishes and Lea did them? Give her the credit." },
  { title: "Settle it at month end", text: "The lowest score does the forfeit you agreed on, like paying for dinner." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <section className="grid items-center gap-10 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">For students sharing a flat</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Get credit for every chore in your flat.</h1>
          <p className="mt-4 text-lg text-muted">
            Log what you do, thank flatmates who cover for you, and the lowest score at the end of the month cooks
            dinner. No awkward talks.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={signedIn ? "/app" : "/signup"}
              className="inline-flex min-h-12 items-center rounded-lg bg-accent px-6 text-lg font-semibold text-accent-foreground hover:brightness-95"
            >
              {signedIn ? "Open your board" : "Sign up free"}
            </Link>
            {!signedIn && (
              <span className="text-sm text-muted">
                Takes 30 seconds.{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Log in
                </Link>
              </span>
            )}
          </div>
        </div>

        <figure className="rounded-2xl bg-board p-5 text-board-foreground shadow-lg" aria-label="Example flat leaderboard">
          <p className="font-mono text-sm uppercase tracking-widest text-board-highlight">Calle Serrano 12 · October</p>
          <ol className="mt-3 divide-y divide-white/10 font-mono">
            {SAMPLE_BOARD.map((row, index) => (
              <li key={row.name} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-3">
                  <span className="w-4 text-right opacity-60">{index + 1}</span>
                  {row.name}
                </span>
                <span className="flex items-center gap-2">
                  {row.watch && <span className="rounded bg-board-highlight px-1.5 text-xs text-board">cooks dinner</span>}
                  <span className="text-lg text-board-highlight">{row.points}</span>
                </span>
              </li>
            ))}
          </ol>
          <figcaption className="mt-3 text-sm opacity-80">Lea did your dishes · thanked by you · +1</figcaption>
        </figure>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3" aria-label="How it works">
        {STEPS.map((step, index) => (
          <div key={step.title} className="rounded-2xl border border-border bg-surface p-5">
            <p className="font-mono text-sm text-muted">0{index + 1}</p>
            <h2 className="mt-2 font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
