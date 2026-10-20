"use client";

import { useActionState } from "react";
import { setForfeit } from "@/app/app/actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";
import { FORFEIT_PRESETS } from "@/lib/presets";

export function ForfeitForm({ flatId, current }: { flatId: string; current: string }) {
  const [state, formAction, pending] = useActionState(setForfeit, initialFormState);

  return (
    <form key={state.resetKey ?? 0} action={formAction} className="space-y-2">
      <input type="hidden" name="flat_id" value={flatId} />
      <label htmlFor="forfeit" className="block text-sm font-medium">
        Change the forfeit
      </label>
      <div className="flex gap-2">
        <input
          id="forfeit"
          name="forfeit"
          type="text"
          required
          maxLength={120}
          list="forfeit-presets"
          defaultValue={current}
          className={inputClass}
        />
        <datalist id="forfeit-presets">
          {FORFEIT_PRESETS.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
        <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </form>
  );
}
