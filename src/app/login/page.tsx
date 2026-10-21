import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { cleanJoinCode } from "@/lib/form-state";

export const metadata: Metadata = { title: "Log in · Choreboard" };

export default async function LogInPage({ searchParams }: PageProps<"/login">) {
  const { join } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="login" join={cleanJoinCode(join)} />
    </AuthShell>
  );
}
