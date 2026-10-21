"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanJoinCode, type FormState } from "@/lib/form-state";
import { currentWeek } from "@/lib/month";
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

// Duties ----------------------------------------------------------------------------------

export async function addDuty(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await signedInClient();

  const title = String(formData.get("title") ?? "").replace(/\s+/g, " ").trim();
  const assignee = String(formData.get("assignee") ?? "") || userId;
  const weekday = Number(formData.get("weekday"));
  if (!title) return { ...prev, error: "Name the duty, e.g. “Take out the bins”." };
  if (title.length > 60) return { ...prev, error: "Keep it under 60 characters." };
  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) return { ...prev, error: "Pick a day." };

  // RLS checks the assignee is in your flat.
  const { error } = await supabase.from("duties").insert({ title, assignee, weekday });
  if (error) return { ...prev, error: "Couldn't add that duty. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

export async function removeDuty(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const id = String(formData.get("duty_id") ?? "");
  const { data, error } = await supabase.from("duties").delete().eq("id", id).select("id");
  if (error || !data?.length) return { ...prev, error: "Couldn't remove that duty. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

// Ticking off a duty logs it as a chore by whoever ticked it, so it earns the usual points
// (and covering for a flatmate gets you the credit).
export async function completeDuty(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const id = String(formData.get("duty_id") ?? "");
  const { data: duty } = await supabase.from("duties").select("id, title").eq("id", id).maybeSingle();
  if (!duty) return { ...prev, error: "That duty no longer exists." };

  // Don't log it twice in one week, e.g. two flatmates tapping Done at the same moment.
  const { count } = await supabase
    .from("chores")
    .select("id", { count: "exact", head: true })
    .eq("duty_id", duty.id)
    .gte("created_at", currentWeek().startIso);
  if (count) {
    revalidatePath("/app");
    return { ...prev, error: "Someone already ticked this one off this week." };
  }

  const { error } = await supabase.from("chores").insert({ title: duty.title, duty_id: duty.id });
  if (error) return { ...prev, error: "Couldn't tick that off. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

export async function nudgeDuty(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const id = String(formData.get("duty_id") ?? "");
  // The database sets who receives it (the duty's assignee) and refuses nudging yourself.
  const { error } = await supabase.from("nudges").insert({ duty_id: id });
  if (error) {
    return {
      ...prev,
      error: error.code === "23505" ? "You already nudged them about this today." : "Couldn't send that nudge.",
    };
  }

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}

export async function dismissNudge(prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await signedInClient();

  const id = String(formData.get("nudge_id") ?? "");
  const { error } = await supabase.from("nudges").delete().eq("id", id);
  if (error) return { ...prev, error: "Couldn't dismiss that. Try again." };

  revalidatePath("/app");
  return { resetKey: (prev.resetKey ?? 0) + 1 };
}
