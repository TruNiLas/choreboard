import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/password-reset-forms";
import { createClient, getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New password · Choreboard" };

// Reached from the reset email, through /auth/callback, which signs the user in first.
// Without that session the link has expired, so send them back to ask for a new one.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  if (!(await getUserId(supabase))) redirect("/forgot-password?expired=1");

  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
