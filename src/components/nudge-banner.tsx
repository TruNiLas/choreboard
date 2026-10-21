import { completeDuty, dismissNudge } from "@/app/app/actions";
import { IdActionButton } from "@/components/id-action-button";
import { WEEKDAYS } from "@/lib/month";
import type { Duty } from "@/components/duties-section";

export type Nudge = { id: string; duty_id: string; from_user: string };

// Nudges a flatmate sent you about one of your open duties. Only you see these.
export function NudgeBanner({
  nudges,
  duties,
  nameOf,
}: {
  nudges: Nudge[];
  duties: Map<string, Duty>;
  nameOf: (userId: string | null) => string;
}) {
  if (nudges.length === 0) return null;

  return (
    <section aria-label="Nudges" className="space-y-4 rounded-[20px] bg-accent-soft p-5 sm:p-6">
      {nudges.map((nudge) => {
        const duty = duties.get(nudge.duty_id);
        if (!duty) return null;
        return (
          <div key={nudge.id}>
            <p>
              <span className="font-medium">{nameOf(nudge.from_user)}</span> gave you a nudge:{" "}
              <span className="font-medium">{duty.title}</span> ({WEEKDAYS[duty.weekday - 1]})
            </p>
            <div className="-ml-3 mt-1 flex flex-wrap gap-x-1">
              <IdActionButton
                action={completeDuty}
                name="duty_id"
                value={duty.id}
                label="Done"
                pendingLabel="Ticking off…"
                look="primary"
              />
              <IdActionButton action={dismissNudge} name="nudge_id" value={nudge.id} label="Dismiss" pendingLabel="Dismissing…" />
            </div>
          </div>
        );
      })}
    </section>
  );
}
