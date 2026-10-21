"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CountUp } from "@/components/count-up";
import { ForfeitTicket, Scoreboard, type ScoreRow, WatchTag } from "@/components/scoreboard";

// A made-up flat. The only place where a flatmate gets named as the loser, as a joke.
const START: Record<string, number> = { lea: 9, you: 7, marco: 6, sam: 4 };
const NAMES: Record<string, string> = { lea: "Lea", you: "You", marco: "Marco", sam: "Sam" };

type Beat = {
  headline: string;
  body: string;
  // What the app would show in the feed for this beat.
  entry?: { title: string; who: string; points?: number; kudos?: string; nudge?: boolean };
  // Points added to the scoreboard when this beat is reached.
  add?: Record<string, number>;
  nudged?: string;
};

const BEATS: Beat[] = [
  {
    headline: "Lea cleans the bathroom.",
    body: "Points come from what you actually did. A bathroom is worth three, a wiped table one.",
    entry: { title: "Cleaned the bathroom", who: "Lea", points: 3 },
    add: { lea: 3 },
  },
  {
    headline: "You do a shopping run.",
    body: "One tap on a quick pick and it's on the board. The same chore twice in a day only counts once.",
    entry: { title: "Did a shopping run", who: "You", points: 2 },
    add: { you: 2 },
  },
  {
    headline: "Marco does your dishes. You thank him.",
    body: "Kudos: the points go to whoever really did it, and everyone sees who said thanks.",
    entry: { title: "Did the dishes", who: "Marco", points: 1, kudos: "you" },
    add: { marco: 1 },
  },
  {
    headline: "Sam's bins were due Tuesday.",
    body: "Lea sends a nudge. Only Sam sees it. No passive-aggressive notes on the fridge.",
    entry: { title: "Take out the bins", who: "Sam", nudge: true },
    nudged: "sam",
  },
  {
    headline: "Sam takes the bins out. And cleans the kitchen.",
    body: "Four points in one evening, and Marco slips to the bottom.",
    entry: { title: "Cleaned the kitchen", who: "Sam", points: 3 },
    add: { sam: 4 },
  },
];

export function MonthStory({ signedIn }: { signedIn: boolean }) {
  // -1: the hero, before any beat. BEATS.length: the final beat, the forfeit.
  const [step, setStep] = useState(-1);
  const beatRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setStep(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      // A beat counts as reached when it crosses just below the middle of the screen, so on
      // phones its headline is still visible under the pinned scoreboard.
      { rootMargin: "-52% 0px -42% 0px" },
    );
    beatRefs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const scores = { ...START };
  BEATS.slice(0, Math.max(0, step + 1)).forEach((beat) => {
    for (const [key, points] of Object.entries(beat.add ?? {})) scores[key] += points;
  });
  const current = step >= 0 && step < BEATS.length ? BEATS[step] : undefined;
  const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b));
  const lowest = ranked[ranked.length - 1];
  const finished = step >= BEATS.length;

  const rows: ScoreRow[] = ranked.map((key) => {
    let tag: ReactNode = null;
    const delta = current?.add?.[key];
    if (delta) tag = <span className="shrink-0 rounded-full bg-board-highlight px-2 py-0.5 text-xs font-bold text-board">+{delta}</span>;
    else if (current?.nudged === key) tag = <span className="shrink-0 rounded-full bg-board-line px-2 py-0.5 text-xs font-bold">nudged</span>;
    else if (key === lowest) tag = <WatchTag />;
    return {
      key,
      name: NAMES[key],
      points: scores[key],
      display: step < 0 ? <CountUp to={scores[key]} delay={250} /> : undefined,
      tag,
    };
  });

  return (
    <section aria-label="How it works" className="relative">
      <div
        className="mx-auto grid max-w-[80rem] gap-x-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:px-12 xl:gap-x-20"
        style={{ gridTemplateRows: `repeat(${BEATS.length + 2}, auto)` }}
      >
        {/* The hero. On desktop the scoreboard sits beside it; on phones, right below. */}
        <div
          data-step={-1}
          ref={(element) => {
            beatRefs.current[0] = element;
          }}
          className="flex min-h-[calc(100svh-4.5rem)] flex-col justify-center py-10 lg:col-start-1 lg:row-start-1 lg:py-0"
        >
          <h1 className="font-display text-[3.75rem] sm:text-[5.5rem] xl:text-[7rem]">
            The chore leaderboard for shared flats.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg text-muted sm:text-xl">
            Log what you do. Thank whoever covered for you. The lowest score on the last day of the month pays
            for dinner.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link id="hero-cta" href={signedIn ? "/app" : "/signup"} className="btn btn-primary min-h-14 px-8 text-lg">
              {signedIn ? "Open your board" : "Sign up free"}
            </Link>
            {!signedIn && (
              <p className="text-muted">
                Free, and your flatmates join with a link.{" "}
                <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
                  Log in
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* The scoreboard: sticky on phones (top of the screen), pinned beside the story on desktop. */}
        <div className="sticky top-0 z-10 -mx-4 bg-background/85 px-4 pb-4 pt-2 backdrop-blur-sm sm:-mx-8 sm:px-8 lg:static lg:col-start-2 lg:row-span-full lg:row-start-1 lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="lg:sticky lg:top-[max(5rem,calc(50svh-17rem))] lg:pt-[calc(50svh-19rem)]">
            <Scoreboard title="Flat 3B" subtitle={finished ? "31 October" : "October"} rows={rows} />
            <div
              className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${finished ? "translate-y-0 rotate-0 opacity-100" : "pointer-events-none -translate-y-6 -rotate-2 opacity-0"}`}
              aria-hidden={!finished}
            >
              <ForfeitTicket className="mx-3 mt-1 sm:mx-5">
                <p className="text-sm font-semibold">Lowest score on 31 October</p>
                <p className="font-display text-[2rem] sm:text-[2.5rem]">{NAMES[lowest]} pays for dinner.</p>
              </ForfeitTicket>
            </div>
          </div>
        </div>

        {BEATS.map((beat, index) => (
          <article
            key={beat.headline}
            data-step={index}
            ref={(element) => {
              beatRefs.current[index + 1] = element;
            }}
            className="flex min-h-[62svh] flex-col justify-center py-10 lg:col-start-1 lg:min-h-[78svh]"
          >
            <p className="font-display text-[1.25rem] text-muted">{index === 0 ? "Then the month starts." : `Day ${[3, 9, 14, 22][index - 1]}`}</p>
            <h2 className="mt-2 font-display text-[2.75rem] sm:text-[4rem]">{beat.headline}</h2>
            <p className="mt-4 max-w-[30rem] text-lg text-muted">{beat.body}</p>
            {beat.entry && <FeedEntry {...beat.entry} />}
          </article>
        ))}

        <article
          data-step={BEATS.length}
          ref={(element) => {
            beatRefs.current[BEATS.length + 1] = element;
          }}
          className="flex min-h-[70svh] flex-col justify-center py-10 lg:col-start-1 lg:min-h-[85svh]"
        >
          <p className="font-display text-[1.25rem] text-muted">Day 31</p>
          <h2 className="mt-2 font-display text-[2.75rem] sm:text-[4rem]">The lowest score does the forfeit.</h2>
          <p className="mt-4 max-w-[30rem] text-lg text-muted">
            You agree on it at the start of the month. Every change shows up in the feed, so nobody quietly swaps
            dinner for something easier.
          </p>
        </article>
      </div>
    </section>
  );
}

// A row the way it looks in the app's feed, so the story shows the real product.
function FeedEntry({
  title,
  who,
  points,
  kudos,
  nudge,
}: {
  title: string;
  who: string;
  points?: number;
  kudos?: string;
  nudge?: boolean;
}) {
  return (
    <div className="mt-8 flex max-w-[28rem] items-center justify-between gap-4 rounded-[20px] bg-surface px-5 py-4 shadow-[0_1px_0_var(--border)]">
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{who}</span>
          {kudos && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-foreground">Kudos from {kudos}</span>
          )}
          {nudge && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-foreground">Still open since Tuesday</span>
          )}
        </p>
      </div>
      {points !== undefined && <span className="font-display text-[2rem] text-accent-ink tabular-nums">+{points}</span>}
      {nudge && (
        <span className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-sm font-bold text-background">Nudge</span>
      )}
    </div>
  );
}
