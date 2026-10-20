import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { cleanJoinCode } from "@/lib/form-state";

export const metadata: Metadata = { title: "Log in · Choreboard" };

export default async function LogInPage({ searchParams }: PageProps<"/login">) {
  const { join } = await searchParams;
  return (
    <main className="flex flex-1 px-4 py-10">
      <AuthForm mode="login" join={cleanJoinCode(join)} />
    </main>
  );
}
