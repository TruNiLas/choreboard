import type { ReactNode } from "react";

type Row = { key: string; name: string; points: number; watch?: boolean };

// The purple leaderboard with the forfeit stub hanging under it. Used for the real board
// on /app and the made-up sample on the landing page.
export function LeaderboardSlab({
  title,
  subtitle,
  rows,
  note,
  stub,
  className = "",
}: {
  title: ReactNode;
  subtitle: string;
  rows: Row[];
  note?: ReactNode;
  stub: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden bg-board text-board-foreground ${className}`} aria-label="Leaderboard">
      <div className="px-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-baseline justify-between gap-3">
          {title}
          <p className="shrink-0 text-sm text-board-muted">{subtitle}</p>
        </div>
        <ol className="mt-2 tabular-nums">
          {rows.map((row, index) => (
            <li
              key={row.key}
              className="flex items-baseline justify-between gap-3 border-b border-board-line py-1.5 last:border-b-0"
            >
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="w-4 text-sm text-board-muted">{index + 1}</span>
                <span className="truncate text-xl">{row.name}</span>
                {row.watch && (
                  <span className="rounded bg-board-line px-1.5 text-xs font-medium">on forfeit watch</span>
                )}
              </span>
              <span
                className={`font-semibold leading-tight tracking-tight ${index === 0 ? "text-[2.5rem]" : "text-3xl"}`}
              >
                {row.points}
              </span>
            </li>
          ))}
        </ol>
        {note && <p className="pb-1 pt-2 text-sm text-board-muted">{note}</p>}
      </div>
      <div className="stub-edge mt-3 bg-stub px-4 pb-4 pt-4 text-stub-foreground sm:px-6">{stub}</div>
    </section>
  );
}
