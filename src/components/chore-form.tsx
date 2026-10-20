"use client";

import { useActionState, useRef } from "react";
import { logChore } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { CHORE_PRESETS } from "@/lib/presets";

type Member = { userId: string; name: string };

export function ChoreForm({ members, me }: { members: Member[]; me: string }) {
  const [state, formAction, pending] = useActionState(logChore, initialFormState);

  return (
    // A successful save bumps resetKey, which remounts the fields empty. A failed one
    // keeps what was typed.
    <ChoreFields key={state.resetKey ?? 0} members={members} me={me} formAction={formAction} pending={pending}>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </ChoreFields>
  );
}

function ChoreFields({
  members,
  me,
  formAction,
  pending,
  children,
}: {
  members: Member[];
  me: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const flatmates = members.filter((member) => member.userId !== me);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="chore-title" className="block text-sm font-medium">
          What got done?
        </label>
        <input
          ref={titleRef}
          id="chore-title"
          name="title"
          type="text"
          required
          maxLength={80}
          autoComplete="off"
          placeholder="e.g. Did the dishes"
          aria-describedby="chore-presets"
          data-testid="core-input"
          className={inputClass}
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
          <select id="chore-done-by" name="done_by" defaultValue="" className={inputClass}>
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
