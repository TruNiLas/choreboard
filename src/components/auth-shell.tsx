import type { ReactNode } from "react";
import { Scoreboard, WatchTag } from "@/components/scoreboard";

// Sign-up and log-in: the form on the right, and on desktop a scoreboard panel on the
// left so the first thing you see is what you're signing up for.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 lg:px-4 lg:pb-4 xl:px-8 xl:pb-8">
      <div className="hidden w-[46%] overflow-hidden rounded-[28px] bg-board text-board-foreground lg:block">
        <div className="tile-grid-board flex h-full flex-col justify-center p-12 xl:p-20">
          <p className="max-w-[12ch] font-display text-[4.5rem]">Your flat, on one scoreboard.</p>
          <Scoreboard
            className="mt-10 max-w-md"
            title="Your flat"
            subtitle="This month"
            rows={[
              { key: "a", name: "You", points: 11 },
              { key: "b", name: "Your flatmate", points: 8 },
              { key: "c", name: "The other one", points: 5, tag: <WatchTag /> },
            ]}
          />
        </div>
      </div>
      <div className="flex flex-1 items-center px-4 py-12 sm:px-8">{children}</div>
    </main>
  );
}
