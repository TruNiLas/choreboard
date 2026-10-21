"use client";

import { useActionState } from "react";
import { addDuty } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { WEEKDAYS } from "@/lib/month";

type Member = { userId: string; name: string };

export function AddDutyForm({ members, me, today }: { members: Member[]; me: string; today: number }) {
  const [state, formAction, pending] = useActionState(addDuty, initialFormState);

  return (
    <form key={state.resetKey ?? 0} action={formAction} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="duty-title" className="block text-sm font-medium">
          What needs doing every week?
        </label>
        <input
          id="duty-title"
          name="title"
          type="text"
          required
          maxLength={60}
          autoComplete="off"
          placeholder="e.g. Take out the bins"
          className={inputClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <label htmlFor="duty-assignee" className="block text-sm font-medium">
            Whose job?
          </label>
          <select id="duty-assignee" name="assignee" defaultValue={me} className={inputClass}>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userId === me ? "Me" : member.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="duty-weekday" className="block text-sm font-medium">
            Every
          </label>
          <select id="duty-weekday" name="weekday" defaultValue={String(today)} className={inputClass}>
            {WEEKDAYS.map((day, index) => (
              <option key={day} value={index + 1}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding…" : "Add duty"}
        </Button>
      </div>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </form>
  );
}
