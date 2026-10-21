"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestPasswordReset, updatePassword } from "@/app/auth-actions";
import { Button, ErrorMessage, inputClass } from "@/components/ui";
import { initialFormState } from "@/lib/form-state";

export function ForgotPasswordForm({ expired }: { expired: boolean }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialFormState);

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-[3rem] sm:text-[3.5rem]">Forgot your password?</h1>
      <p className="mt-2 text-lg text-muted">
        {expired
          ? "That reset link has expired or was already used. Ask for a new one below."
          : "Enter the email you signed up with and we'll send you a link to set a new one."}
      </p>

      {state.message ? (
        <p role="status" className="mt-8 rounded-[14px] bg-accent-soft px-4 py-3">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="mt-8 space-y-5" noValidate>
          <div className="space-y-1">
            <label htmlFor="reset-email" className="block text-sm font-semibold">
              Email
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              className={inputClass}
            />
          </div>
          {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialFormState);
  const [show, setShow] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="font-display text-[3rem] sm:text-[3.5rem]">Set a new password</h1>
      <p className="mt-2 text-lg text-muted">You&rsquo;ll go straight to your board afterwards.</p>

      <form action={formAction} className="mt-8 space-y-5" noValidate>
        <div className="space-y-1">
          <label htmlFor="new-password" className="block text-sm font-semibold">
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              aria-describedby="new-password-hint"
              className={`${inputClass} pr-20`}
            />
            <button
              type="button"
              onClick={() => setShow((shown) => !shown)}
              aria-pressed={show}
              aria-controls="new-password"
              className="absolute inset-y-1 right-1 min-w-16 rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <p id="new-password-hint" className="text-xs text-muted">
            At least 6 characters.
          </p>
        </div>
        {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </div>
  );
}
