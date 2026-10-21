import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/password-reset-forms";

export const metadata: Metadata = { title: "Forgot password · Choreboard" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { expired } = await searchParams;
  return (
    <AuthShell>
      <ForgotPasswordForm expired={expired === "1"} />
    </AuthShell>
  );
}
