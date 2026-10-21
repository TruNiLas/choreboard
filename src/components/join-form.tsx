"use client";

import { useActionState, useState } from "react";
import { joinFlat } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";

export function JoinForm({
  defaultCode,
  alone,
  currentCode,
}: {
  defaultCode?: string;
  alone: boolean;
  currentCode: string;
}) {
  const [state, formAction, pending] = useActionState(joinFlat, initialFormState);
  // Controlled, so a failed join keeps the code to fix a typo (React clears uncontrolled
  // fields after every action). Spaces are dropped before cutting to 6 characters, so a
  // pasted " k7m2qx " still fits; a maxLength would cut it first.
  const [code, setCode] = useState(defaultCode ?? "");
  const ownCode = code === currentCode;

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
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="K7M2QX"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\s/g, "").toUpperCase().slice(0, 6))}
          aria-describedby="join-hint"
          className={`${inputClass} uppercase tracking-[0.2em] tabular-nums`}
        />
        <Button type="submit" variant="secondary" disabled={pending || ownCode} className="shrink-0">
          {pending ? "Joining…" : "Join"}
        </Button>
      </div>
      <p id="join-hint" className="text-xs text-muted">
        {ownCode
          ? "That's your flat's own code. Share it with your flatmates instead."
          : alone
            ? "Joining moves you into their flat."
            : "Joining moves you into their flat. Your current flat keeps its history."}
      </p>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </form>
  );
}
