import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChoreForm } from "@/components/chore-form";
import { CopyButton } from "@/components/copy-button";
import { ForfeitForm } from "@/components/forfeit-form";
import { JoinForm } from "@/components/join-form";
import { Card } from "@/components/ui";
import { cleanJoinCode } from "@/lib/form-state";
import { currentMonth, timeAgo } from "@/lib/month";
import { createClient, getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your board · Choreboard" };

// Personal data: never prerender or cache this page.
export const dynamic = "force-dynamic";

type Member = { user_id: string; display_name: string };
type Chore = { id: string; title: string; points: number; done_by: string; user_id: string; created_at: string };

export default async function BoardPage({ searchParams }: PageProps<"/app">) {
  const supabase = await createClient();
  const me = await getUserId(supabase);
  if (!me) redirect("/login");

  const month = currentMonth();
  const { join } = await searchParams;
  const inviteCode = cleanJoinCode(join);

  // RLS scopes all three reads to the caller's own flat.
  const [flatResult, membersResult, recentResult, monthResult] = await Promise.all([
    supabase.from("flats").select("id, name, join_code, forfeit").single(),
    supabase.from("flat_members").select("user_id, display_name").order("joined_at"),
    supabase
      .from("chores")
      .select("id, title, points, done_by, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("chores").select("done_by, points").gte("created_at", month.startIso),
  ]);

  const flat = flatResult.data;
  if (!flat) {
    // Only happens if the sign-up trigger did not run for this account.
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <Card>
          <p>We couldn&apos;t find your flat. Log out and back in; if it stays this way, the flat setup failed.</p>
        </Card>
      </main>
    );
  }

  const members: Member[] = membersResult.data ?? [];
  const chores: Chore[] = recentResult.data ?? [];
  const names = new Map(members.map((member) => [member.user_id, member.display_name]));
  const nameOf = (userId: string) => (userId === me ? "You" : (names.get(userId) ?? "A former flatmate"));

  const scores = new Map(members.map((member) => [member.user_id, 0]));
  for (const chore of monthResult.data ?? []) {
    if (scores.has(chore.done_by)) scores.set(chore.done_by, (scores.get(chore.done_by) ?? 0) + chore.points);
  }
  const leaderboard = [...scores.entries()]
    .map(([userId, points]) => ({ userId, points }))
    .sort((a, b) => b.points - a.points);
  const lowest = leaderboard.length > 1 ? leaderboard[leaderboard.length - 1] : null;

  const host = (await headers()).get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const inviteLink = `${protocol}://${host}/join/${flat.join_code}`;
  const whatsappText = encodeURIComponent(`Join our flat on Choreboard: ${inviteLink}`);
  const alone = members.length <= 1;
  const showInvitePrompt = inviteCode && inviteCode !== flat.join_code;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      {showInvitePrompt && (
        <Card className="border-accent">
          <h2 className="font-semibold">You were invited to a flat</h2>
          <p className="mt-1 text-sm text-muted">Join it to share one board with your flatmates.</p>
          <div className="mt-3">
            <JoinForm defaultCode={inviteCode} alone={alone} />
          </div>
        </Card>
      )}

      <Card>
        <h1 className="text-xl font-semibold">Log a chore</h1>
        <p className="mb-4 text-sm text-muted">Credit for what you did, or thank a flatmate who covered for you.</p>
        <ChoreForm members={members.map((m) => ({ userId: m.user_id, name: m.display_name }))} me={me} />
      </Card>

      <section className="rounded-2xl bg-board p-4 text-board-foreground sm:p-5" aria-labelledby="board-title">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="board-title" className="font-mono text-sm uppercase tracking-widest text-board-highlight">
            {flat.name} · {month.name}
          </h2>
          <span className="font-mono text-xs opacity-70">
            {month.daysLeft === 0 ? "Last day" : `${month.daysLeft} days left`}
          </span>
        </div>
        <ol className="mt-3 divide-y divide-white/10">
          {leaderboard.map((row, index) => (
            <li key={row.userId} className="flex items-center justify-between gap-3 py-2 font-mono">
              <span className="flex min-w-0 items-center gap-3">
                <span className="w-5 text-right opacity-60">{index + 1}</span>
                <span className="truncate">{nameOf(row.userId)}</span>
              </span>
              <span className="flex items-center gap-2">
                {lowest?.userId === row.userId && (
                  <span className="rounded bg-board-highlight px-1.5 text-xs text-board">on forfeit watch</span>
                )}
                <span className="text-lg text-board-highlight tabular-nums">{row.points}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm opacity-80">
          Lowest score on the last day of {month.name}: <span className="font-semibold">{flat.forfeit}</span>
        </p>
      </section>

      <Card>
        <h2 className="font-semibold">Recent chores</h2>
        {chores.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing logged yet. Did the dishes today? Log it above.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {chores.map((chore) => (
              <li key={chore.id} data-testid="core-item" className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="break-words font-medium">{chore.title}</p>
                  <p className="text-xs text-muted">
                    {nameOf(chore.done_by)}
                    {chore.user_id !== chore.done_by && ` · thanked by ${nameOf(chore.user_id)}`}
                    {" · "}
                    {timeAgo(chore.created_at)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm text-success">+{chore.points}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">{alone ? "Invite your flatmates" : "Your flat"}</h2>
          <p className="mt-1 text-sm text-muted">
            Send them the link, or have them type the code on their board after signing up.
          </p>
          <p className="mt-3 font-mono text-3xl tracking-[0.3em]" aria-label={`Flat code ${flat.join_code.split("").join(" ")}`}>
            {flat.join_code}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={inviteLink} label="Copy invite link" />
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold hover:bg-background"
            >
              Share on WhatsApp
            </a>
          </div>
          {!alone && (
            <p className="mt-3 text-sm text-muted">
              In this flat: {members.map((member) => nameOf(member.user_id)).join(", ")}
            </p>
          )}
        </div>
        <ForfeitForm flatId={flat.id} current={flat.forfeit} />
        {!showInvitePrompt && <JoinForm alone={alone} />}
      </Card>
    </main>
  );
}
