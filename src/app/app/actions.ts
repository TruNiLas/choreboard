"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanJoinCode, type FormState } from "@/lib/form-state";
import { createClient, getUserId } from "@/lib/supabase/server";

// Every action re-checks the session itself; being rendered on /app proves nothing.
async function signedInClient() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect("/login");
  return { supabase, userId };
}

export async function logChore(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const title = String(formData.get("title") ?? "").trim();
  const doneBy = String(formData.get("done_by") ?? "").trim();
  if (!title) return { ...prev, error: "Write what got done, e.g. “Did the dishes”." };
  if (title.length > 80) return { ...prev, error: "Keep it under 80 characters." };

  // done_by left empty means "me": the database default fills it in. Points are set by a
  // database trigger from the title, never sent from here.
  const { error } = await supabase.from("chores").insert(doneBy ? { title, done_by: doneBy } : { title });
  if (error) return { ...prev, error: "Couldn't save that chore. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

export async function joinFlat(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const code = cleanJoinCode(formData.get("code"));
  if (!code) return { ...prev, error: "A flat code has 6 letters and numbers, like K7M2QX." };

  const { error } = await supabase.rpc("join_flat", { code });
  if (error) {
    return {
      ...prev,
      error: error.message.startsWith("No flat has the code")
        ? `No flat has the code ${code}. Check it with your flatmate.`
        : "Couldn't join that flat. Try again.",
    };
  }

  revalidatePath("/app");
  redirect("/app");
}

export async function setDisplayName(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await signedInClient();

  // Collapse runs of spaces so "  Nico   T " can't sneak past the length check looking empty.
  const name = String(formData.get("display_name") ?? "").replace(/\s+/g, " ").trim();
  if (!name) return { ...prev, error: "Write the name your flatmates know you by." };
  if (name.length > 40) return { ...prev, error: "Keep it under 40 characters." };

  // RLS and the column grant only allow changing your own display name.
  const { data, error } = await supabase
    .from("flat_members")
    .update({ display_name: name })
    .eq("user_id", userId)
    .select("user_id");
  if (error || !data?.length) return { ...prev, error: "Couldn't save your name. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

export async function setForfeit(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const flatId = String(formData.get("flat_id") ?? "");
  const forfeit = String(formData.get("forfeit") ?? "").trim();
  if (!forfeit) return { ...prev, error: "Pick or write a forfeit." };
  if (forfeit.length > 120) return { ...prev, error: "Keep it under 120 characters." };

  // RLS only lets members update their own flat, whatever id is posted here.
  const { error } = await supabase.from("flats").update({ forfeit }).eq("id", flatId);
  if (error) return { ...prev, error: "Couldn't save the forfeit. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

// Removing your own entry (within 24 hours) and declining a kudos given to you. The
// delete policy decides which of the two applies; anything else deletes nothing.
export async function removeChore(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const id = String(formData.get("chore_id") ?? "");
  const { data, error } = await supabase.from("chores").delete().eq("id", id).select("id");
  if (error || !data?.length) {
    return { ...prev, error: "Couldn't remove that. Your own entries can be removed for 24 hours." };
  }

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}
