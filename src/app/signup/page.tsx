import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { cleanJoinCode } from "@/lib/form-state";

export const metadata: Metadata = { title: "Sign up · Choreboard" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { join } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="signup" join={cleanJoinCode(join)} />
    </AuthShell>
  );
}
