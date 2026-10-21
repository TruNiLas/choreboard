"use client";

import { useActionState } from "react";
import { setDisplayName } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";

export function NameForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState(setDisplayName, initialFormState);

  return (
    <form key={state.resetKey ?? 0} action={formAction} className="space-y-2">
      <label htmlFor="display-name" className="block text-sm font-medium">
        Your name on the board
      </label>
      <div className="flex gap-2">
        <input
          id="display-name"
          name="display_name"
          type="text"
          required
          maxLength={40}
          autoComplete="nickname"
          defaultValue={current}
          aria-describedby="display-name-hint"
          className={inputClass}
        />
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p id="display-name-hint" className="text-xs text-muted">
        What your flatmates see on the leaderboard and in the feed.
      </p>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </form>
  );
}
