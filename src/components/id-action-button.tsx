"use client";

import { useActionState, useState } from "react";
import { ErrorMessage } from "@/components/ui";
import { type FormState, initialFormState } from "@/lib/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const looks = {
  primary: "bg-accent text-accent-foreground hover:brightness-110",
  quiet: "text-muted hover:bg-surface hover:text-foreground",
  danger: "text-danger hover:bg-surface",
} as const;

// One button that posts a single id to a server action, e.g. "Done" on a duty. With
// `confirm`, the first tap asks and only the second one acts (for things that can't be
// undone).
export function IdActionButton({
  action,
  name,
  value,
  label,
  pendingLabel,
  look = "quiet",
  confirm,
}: {
  action: Action;
  name: string;
  value: string;
  label: string;
  pendingLabel: string;
  look?: keyof typeof looks;
  confirm?: { ask: string; yes: string };
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [asking, setAsking] = useState(false);
  const button = `min-h-11 rounded-md px-3 text-sm font-medium disabled:opacity-60`;

  if (confirm && !asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`${button} ${looks[look]}`}>
        {label}
      </button>
    );
  }

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-center gap-x-1">
        <input type="hidden" name={name} value={value} />
        {confirm && <span className="pl-1 pr-1 text-sm text-muted">{confirm.ask}</span>}
        <button
          type="submit"
          disabled={pending}
          className={`${button} ${confirm ? looks.danger : looks[look]}`}
        >
          {pending ? pendingLabel : confirm ? confirm.yes : label}
        </button>
        {confirm && (
          <button type="button" onClick={() => setAsking(false)} className={`${button} ${looks.quiet}`}>
            Keep
          </button>
        )}
      </form>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </div>
  );
}
