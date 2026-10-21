"use client";

import { useActionState, useRef, useState } from "react";
import { logChore } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { choreGroup, repeatKey } from "@/lib/points";
import { CHORE_PRESETS } from "@/lib/presets";

type Member = { userId: string; name: string };
// Per flatmate, the repeat keys (see repeatKey) that already earned points today.
type CountedToday = Record<string, string[]>;

const TITLE_MAX = 80;

export function ChoreForm({ members, me, countedToday }: { members: Member[]; me: string; countedToday: CountedToday }) {
  const [state, formAction, pending] = useActionState(logChore, initialFormState);

  return (
    // A successful save bumps resetKey, which remounts the fields empty. A failed one
    // keeps what was typed.
    <ChoreFields
      key={state.resetKey ?? 0}
      members={members}
      me={me}
      countedToday={countedToday}
      formAction={formAction}
      pending={pending}
    >
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </ChoreFields>
  );
}

function ChoreFields({
  members,
  me,
  countedToday,
  formAction,
  pending,
  children,
}: {
  members: Member[];
  me: string;
  countedToday: CountedToday;
  formAction: (formData: FormData) => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [doneBy, setDoneBy] = useState("");
  const titleLength = title.length;
  const flatmates = members.filter((member) => member.userId !== me);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="chore-title" className="block text-sm font-medium">
            What got done?
          </label>
          {/* Only near the limit, so a long title doesn't stop mid-word without warning. */}
          {titleLength >= TITLE_MAX - 20 && (
            <span className="text-xs text-muted tabular-nums" aria-live="polite">
              {titleLength}/{TITLE_MAX}
            </span>
          )}
        </div>
        <input
          ref={titleRef}
          id="chore-title"
          name="title"
          type="text"
          required
          maxLength={TITLE_MAX}
          onInput={(event) => setTitle(event.currentTarget.value)}
          autoComplete="off"
          placeholder="e.g. Did the dishes"
          aria-describedby="chore-presets"
          data-testid="core-input"
          className={inputClass}
        />
        <PointsPreview
          title={title}
          doneBy={doneBy || me}
          who={doneBy ? (members.find((member) => member.userId === doneBy)?.name ?? "them") : "you"}
          countedToday={countedToday}
        />
      </div>

      <div id="chore-presets" className="-mt-1 flex flex-wrap gap-2" aria-label="Quick picks">
        {CHORE_PRESETS.map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => {
              if (titleRef.current) {
                titleRef.current.value = preset.title;
                setTitle(preset.title);
                titleRef.current.focus();
              }
            }}
            className="min-h-11 rounded-full border border-border px-3 text-sm hover:border-accent"
          >
            {preset.title} <span className="text-muted tabular-nums">+{preset.points}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1 sm:flex-1">
          <label htmlFor="chore-done-by" className="block text-sm font-medium">
            Who did it?
          </label>
          {/* Empty value means "me": the database fills in the logged-in user. */}
          <select
            id="chore-done-by"
            name="done_by"
            defaultValue=""
            onChange={(event) => setDoneBy(event.currentTarget.value)}
            className={inputClass}
          >
            <option value="">Me</option>
            {flatmates.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name} (thank them)
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending} data-testid="core-submit" className="w-full sm:w-40">
          {pending ? "Logging…" : "Log it"}
        </Button>
      </div>

      {children}
    </form>
  );
}

// A guess from the same rules the database uses (src/lib/points.ts). The database still
// decides; this only says what to expect before saving.
function PointsPreview({
  title,
  doneBy,
  who,
  countedToday,
}: {
  title: string;
  doneBy: string;
  who: string;
  countedToday: CountedToday;
}) {
  const trimmed = title.trim();
  let text = "";
  if (trimmed) {
    const group = choreGroup(trimmed);
    const repeat = countedToday[doneBy]?.includes(repeatKey(trimmed, group?.key ?? null));
    text = repeat
      ? `Worth +0: ${group ? group.label : "this one"} already counted for ${who} today`
      : `Worth +${group?.points ?? 1}${group ? ` (${group.label})` : ""}`;
  }
  // Always rendered, so the layout does not jump while typing.
  return (
    <p className="min-h-5 text-sm text-accent-ink" aria-live="polite">
      {text}
    </p>
  );
}
