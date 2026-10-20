import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { cleanJoinCode } from "@/lib/form-state";

export const metadata: Metadata = { title: "Sign up · Choreboard" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { join } = await searchParams;
  return (
    <main className="flex flex-1 px-4 py-12 sm:py-20">
      <AuthForm mode="signup" join={cleanJoinCode(join)} />
    </main>
  );
}
