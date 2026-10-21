"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cleanJoinCode, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    join: cleanJoinCode(formData.get("join")),
  };
}

// After sign-up and login the user always lands on /app. An invite code rides along so
// /app can offer to join that flat.
function appPath(join: string | null) {
  return join ? `/app?join=${join}` : "/app";
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const { email, password, join } = readCredentials(formData);
  if (!email || !password) return { error: "Enter an email and a password.", email };
  if (password.length < 6) return { error: "Use at least 6 characters for the password.", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message, email };

  // No session means Supabase still requires email confirmation, which this app cannot
  // complete. Say so instead of pretending an email is on its way.
  if (!data.session) {
    return {
      error:
        "Your account was created, but email confirmation is still switched on for this app, so you can't log in yet.",
      email,
    };
  }

  redirect(appPath(join));
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const { email, password, join } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, email };

  redirect(appPath(join));
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email you signed up with." };

  // The link in the email comes back to this site, whichever host it runs on.
  const host = (await headers()).get("host") ?? "";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const redirectTo = `${protocol}://${host}/auth/callback?next=/reset-password`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: error.message, email };

  // Same message whether or not the account exists, so the form can't be used to find
  // out who has signed up.
  return { message: `If ${email} has an account, a reset link is on its way. Check your spam folder too.` };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "Use at least 6 characters for the password." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "This reset link has expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/app");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
