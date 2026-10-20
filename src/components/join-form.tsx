"use client";

import { useActionState } from "react";
import { joinFlat } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";

export function JoinForm({ defaultCode, alone }: { defaultCode?: string; alone: boolean }) {
  const [state, formAction, pending] = useActionState(joinFlat, initialFormState);

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="join-code" className="block text-sm font-medium">
        Got a code from a flatmate?
      </label>
      <div className="flex gap-2">
        <input
          id="join-code"
          name="code"
          type="text"
          required
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="K7M2QX"
          defaultValue={defaultCode}
          aria-describedby="join-hint"
          className={`${inputClass} font-mono uppercase tracking-widest`}
        />
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          {pending ? "Joining…" : "Join"}
        </Button>
      </div>
      <p id="join-hint" className="text-xs text-muted">
        {alone
          ? "Joining moves you into their flat."
          : "Joining moves you into their flat. Your current flat keeps its history."}
      </p>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </form>
  );
}
