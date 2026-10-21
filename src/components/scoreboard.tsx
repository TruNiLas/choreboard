import type { ReactNode } from "react";

export type ScoreRow = {
  key: string;
  name: string;
  points: number;
  // Rendered instead of the number, e.g. a count-up on the landing page.
  display?: ReactNode;
  // Small tag after the name: "on forfeit watch", "+3", "nudged".
  tag?: ReactNode;
};

// The flat's scoreboard. Rows are rendered in a stable order and moved into place with a
// transform, so when the ranking changes (a chore logged, a story beat on the landing
// page) the rows slide to their new positions instead of jumping.
export function Scoreboard({
  title,
  subtitle,
  rows,
  note,
  className = "",
}: {
  title: ReactNode;
  subtitle: ReactNode;
  // Already sorted, highest first.
  rows: ScoreRow[];
  note?: ReactNode;
  className?: string;
}) {
  const rank = new Map(rows.map((row, index) => [row.key, index]));
  const stable = [...rows].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <section
      aria-label="Leaderboard"
      className={`tile-grid-board relative overflow-hidden rounded-[24px] bg-board px-5 py-4 text-board-foreground sm:rounded-[28px] shadow-[0_24px_60px_-24px_rgb(19_33_60/0.55)] sm:p-7 ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 truncate font-display text-[1.5rem] sm:text-[2rem]">{title}</div>
        <div className="shrink-0 text-sm text-board-muted">{subtitle}</div>
      </div>

      {/* The visible order is the ranked order; screen readers get it from this list. */}
      <ol className="sr-only">
        {rows.map((row, index) => (
          <li key={row.key}>
            {index + 1}. {row.name}, {row.points} points
          </li>
        ))}
      </ol>

      <div
        aria-hidden
        className="relative mt-2 [--row-h:2.9rem] sm:mt-3 sm:[--row-h:4.25rem]"
        style={{ height: `calc(var(--row-h) * ${rows.length})` }}
      >
        {stable.map((row) => {
          const index = rank.get(row.key) ?? 0;
          const leader = index === 0 && rows.length > 1;
          return (
            <div
              key={row.key}
              className="absolute inset-x-0 top-0 flex h-[var(--row-h)] items-center justify-between gap-3 border-b border-board-line transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{ transform: `translateY(calc(var(--row-h) * ${index}))` }}
            >
              <span className="flex min-w-0 items-center gap-3 sm:gap-4">
                <span className="w-5 font-display text-xl text-board-muted tabular-nums">{index + 1}</span>
                <span className="truncate font-semibold sm:text-xl">{row.name}</span>
                {row.tag}
              </span>
              <span
                className={`font-display tabular-nums ${leader ? "text-[2.25rem] text-board-highlight sm:text-[3.5rem]" : "text-[1.875rem] sm:text-[2.75rem]"}`}
              >
                {row.display ?? row.points}
              </span>
            </div>
          );
        })}
      </div>

      {note && <p className="mt-3 text-sm text-board-muted">{note}</p>}
    </section>
  );
}

// The forfeit, as a glove-yellow ticket stub. `gap` is the colour behind the ticket, which
// shows through the perforation.
export function ForfeitTicket({
  children,
  gap = "var(--background)",
  className = "",
}: {
  children: ReactNode;
  gap?: string;
  className?: string;
}) {
  return (
    <div
      className={`ticket rounded-b-[20px] rounded-t-[6px] px-5 pb-5 pt-6 shadow-[0_16px_40px_-20px_rgb(19_33_60/0.5)] sm:px-7 ${className}`}
      style={{ ["--ticket-gap" as string]: gap }}
    >
      {children}
    </div>
  );
}

export function WatchTag() {
  return (
    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
      on forfeit watch
    </span>
  );
}
