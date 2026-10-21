import { completeDuty, nudgeDuty, removeDuty } from "@/app/app/actions";
import { AddDutyForm } from "@/components/add-duty-form";
import { IdActionButton } from "@/components/id-action-button";
import { WEEKDAYS } from "@/lib/month";

export type Duty = { id: string; title: string; assignee: string; weekday: number };
type Member = { userId: string; name: string };

// The flat's weekly duties and where each one stands this week (Monday to Sunday).
export function DutiesSection({
  duties,
  doneBy,
  nudgedToday,
  nudgedBy,
  members,
  me,
  today,
  nameOf,
}: {
  duties: Duty[];
  // duty id -> who ticked it off this week
  doneBy: Map<string, string>;
  // duty ids I already nudged someone about today
  nudgedToday: Set<string>;
  // duty id -> who nudged me about it (my open duties only)
  nudgedBy: Map<string, string[]>;
  members: Member[];
  me: string;
  today: number;
  nameOf: (userId: string | null) => string;
}) {
  const sorted = [...duties].sort((a, b) => a.weekday - b.weekday || a.title.localeCompare(b.title));

  return (
    <section aria-labelledby="duties-title">
      <h2 id="duties-title" className="font-display text-[2.25rem] sm:text-[2.75rem]">
        This week&rsquo;s duties
      </h2>
      <p className="mt-1 text-muted">
        The jobs your flat agreed on. Tick one off and the points are yours, or nudge a flatmate whose job is still
        open. Only they see it.
      </p>

      {sorted.length === 0 ? (
        <p className="mt-3 text-muted">
          No duties yet. Agree who takes the bins out and who does the bathroom, then add them below.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {sorted.map((duty) => (
            <DutyRow
              key={duty.id}
              duty={duty}
              doneBy={doneBy.get(duty.id)}
              nudged={nudgedToday.has(duty.id)}
              nudgers={nudgedBy.get(duty.id)}
              me={me}
              today={today}
              nameOf={nameOf}
            />
          ))}
        </ul>
      )}

      {/* Bordered, not a grey panel: the inputs inside are grey (surface) themselves. */}
      <details className="mt-5 rounded-[20px] border-2 border-border p-5 sm:p-6" open={sorted.length === 0}>
        <summary className="min-h-11 cursor-pointer content-center font-semibold">Add a duty</summary>
        <div className="mt-3">
          <AddDutyForm members={members} me={me} today={today} />
        </div>
      </details>
    </section>
  );
}

function DutyRow({
  duty,
  doneBy,
  nudged,
  nudgers,
  me,
  today,
  nameOf,
}: {
  duty: Duty;
  doneBy: string | undefined;
  nudged: boolean;
  nudgers?: string[];
  me: string;
  today: number;
  nameOf: (userId: string | null) => string;
}) {
  const day = WEEKDAYS[duty.weekday - 1];
  const mine = duty.assignee === me;
  const due = !doneBy && duty.weekday <= today;
  // Any flatmate's open duty can be nudged: overdue ones, and upcoming ones as a heads-up.
  const canNudge = !doneBy && !mine;
  const whatsapp = encodeURIComponent(
    due
      ? `Friendly nudge from Choreboard: “${duty.title}” was on your list for ${day}.`
      : `Friendly heads-up from Choreboard: “${duty.title}” is on your list for ${day}.`,
  );

  let status: { text: string; className: string };
  if (doneBy) {
    // nameOf says "You" for me, which reads wrong mid-sentence.
    const who = nameOf(doneBy).replace(/^You$/, "you");
    status = {
      text: doneBy === duty.assignee ? `Done by ${who}` : `Covered by ${who}`,
      className: "text-success",
    };
  } else if (duty.weekday === today) {
    status = { text: "Due today", className: "rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground" };
  } else if (duty.weekday < today) {
    status = { text: `Still open since ${day}`, className: "rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-foreground" };
  } else {
    status = { text: `Coming up ${day}`, className: "text-muted" };
  }

  return (
    <li className="py-4">
      <p className="break-words text-lg font-semibold">{duty.title}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <span>
          {nameOf(duty.assignee)}, every {day}
        </span>
        <span className={`text-sm font-medium ${status.className}`}>{status.text}</span>
        {!doneBy && nudgers && nudgers.length > 0 && (
          <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-bold text-background">
            {nudgers.join(" and ")} nudged you
          </span>
        )}
      </p>

      <div className="-ml-3 mt-1 flex flex-wrap items-center gap-x-1">
        {!doneBy && (
          <IdActionButton
            action={completeDuty}
            name="duty_id"
            value={duty.id}
            label={mine ? "Done" : "I did it"}
            pendingLabel="Ticking off…"
            look={mine && due ? "primary" : "quiet"}
          />
        )}
        {canNudge &&
          (nudged ? (
            <span className="px-3 text-sm font-semibold text-muted">Nudged today</span>
          ) : (
            <IdActionButton
              action={nudgeDuty}
              name="duty_id"
              value={duty.id}
              label={`Nudge ${nameOf(duty.assignee)}`}
              pendingLabel="Nudging…"
              look="secondary"
            />
          ))}
        {canNudge && (
          <a
            href={`https://wa.me/?text=${whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Nudge on WhatsApp
          </a>
        )}
        <IdActionButton
          action={removeDuty}
          name="duty_id"
          value={duty.id}
          label="Remove"
          pendingLabel="Removing…"
          confirm={{ ask: "Remove this duty for everyone?", yes: "Yes, remove" }}
        />
      </div>
    </li>
  );
}
