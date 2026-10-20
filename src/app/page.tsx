import Link from "next/link";
import { LeaderboardSlab } from "@/components/leaderboard-slab";
import { buttonLooks } from "@/components/ui";
import { currentMonth } from "@/lib/month";
import { createClient, getUserId } from "@/lib/supabase/server";

// A made-up flat. The only place where the last flatmate gets named as a joke.
const SAMPLE_BOARD = [
  { key: "lea", name: "Lea", points: 14 },
  { key: "you", name: "You", points: 11 },
  { key: "marco", name: "Marco", points: 9 },
  { key: "sam", name: "Sam", points: 4, watch: true },
];

const STEPS = [
  { title: "Log what you did", text: "Dishes, bins, bathroom. One tap and it’s on the board." },
  { title: "Give kudos", text: "Lea did your dishes? She gets the points, you get to say thanks." },
  { title: "Settle it on the last day", text: "The lowest score does the forfeit you all agreed on." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));
  const month = currentMonth();

  return (
    <main className="mx-auto w-full max-w-5xl pb-16 sm:px-4">
      <div className="grid items-center gap-8 sm:py-12 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:py-20">
        <section className="px-4 pt-8 sm:px-0 sm:pt-0">
          <h1 className="text-[2.625rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.5rem]">
            Credit for every chore in your flat.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            For students sharing a flat. Log what you do, give kudos when a flatmate covers for you, and the
            month&rsquo;s lowest score does the forfeit.
          </p>
          <div className="mt-6 flex flex-col items-start gap-3">
            <Link href={signedIn ? "/app" : "/signup"} className={`${buttonLooks.primary} text-lg`}>
              {signedIn ? "Open your board" : "Sign up free"}
            </Link>
            {!signedIn && (
              <p className="text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-foreground underline underline-offset-4">
                  Log in
                </Link>
              </p>
            )}
          </div>
        </section>

        <LeaderboardSlab
          className="sm:rounded-2xl"
          title={<p className="text-lg font-medium">Flat 3B</p>}
          subtitle={`${month.name}, ${month.daysLeft === 0 ? "last day" : `${month.daysLeft} days left`}`}
          rows={SAMPLE_BOARD}
          stub={
            <p>
              On {month.lastDay} {month.name}, <span className="font-semibold">Sam pays for dinner.</span> Unless Sam
              finds the bathroom first.
            </p>
          }
        />
      </div>

      <section aria-label="How it works" className="mt-10 grid gap-6 px-4 sm:mt-4 sm:grid-cols-3 sm:px-0">
        {STEPS.map((step) => (
          <div key={step.title}>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-muted">{step.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
