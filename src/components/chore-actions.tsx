"use client";

import { useActionState, useState } from "react";
import { removeChore } from "@/app/app/actions";
import { ErrorMessage } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";

const textButton = "min-h-11 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-surface disabled:opacity-60";

// "remove": your own entry, within 24 hours. "decline": a kudos someone gave you.
// Two taps, because removing can't be undone.
export function ChoreActions({ choreId, kind }: { choreId: string; kind: "remove" | "decline" }) {
  const [state, formAction, pending] = useActionState(removeChore, initialFormState);
  const [confirming, setConfirming] = useState(false);

  const ask = kind === "remove" ? "Remove this entry?" : "Not you? The points go back.";
  const confirm = kind === "remove" ? "Yes, remove" : "Decline kudos";

  return (
    <div className="-ml-2">
      {confirming ? (
        <form action={formAction} className="flex flex-wrap items-center gap-x-1">
          <input type="hidden" name="chore_id" value={choreId} />
          <span className="pl-2 pr-1 text-sm text-muted">{ask}</span>
          <button type="submit" disabled={pending} className={`${textButton} text-danger`}>
            {pending ? "Removing…" : confirm}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={`${textButton} text-muted`}>
            Keep
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={`${textButton} text-muted`}>
          {kind === "remove" ? "Remove" : "Not me"}
        </button>
      )}
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </div>
  );
}
