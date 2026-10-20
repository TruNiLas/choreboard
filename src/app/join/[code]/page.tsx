import { redirect } from "next/navigation";
import { cleanJoinCode } from "@/lib/form-state";
import { createClient, getUserId } from "@/lib/supabase/server";

// Invite links: /join/ABC234. Signed-in users go straight to the join prompt on /app,
// everyone else signs up first and lands there afterwards.
export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  const join = cleanJoinCode(code);
  if (!join) redirect("/signup");

  const supabase = await createClient();
  const signedIn = Boolean(await getUserId(supabase));
  redirect(signedIn ? `/app?join=${join}` : `/signup?join=${join}`);
}
