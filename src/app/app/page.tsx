import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChoreForm } from "@/components/chore-form";
import { CopyButton } from "@/components/copy-button";
import { ForfeitForm } from "@/components/forfeit-form";
import { JoinForm } from "@/components/join-form";
import { LeaderboardSlab } from "@/components/leaderboard-slab";
import { buttonLooks, Panel } from "@/components/ui";
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
        <Panel>
          <p>We couldn&apos;t find your flat. Log out and back in; if it stays this way, the flat setup failed.</p>
        </Panel>
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
    <main className="mx-auto w-full max-w-3xl pb-16 sm:px-4 sm:pt-6">
      {showInvitePrompt && (
        <section className="mx-4 my-4 rounded-xl bg-accent-soft p-4 sm:mx-0 sm:mt-0 sm:p-5">
          <h2 className="text-lg font-semibold">You were invited to a flat</h2>
          <p className="mt-1 text-sm text-muted">Join it to share one board with your flatmates.</p>
          <div className="mt-3">
            <JoinForm defaultCode={inviteCode} alone={alone} />
          </div>
        </section>
      )}

      <LeaderboardSlab
        className="sm:rounded-2xl"
        title={<h1 className="min-w-0 truncate text-lg font-medium">{flat.name}</h1>}
        subtitle={`${month.name}, ${month.daysLeft === 0 ? "last day" : `${month.daysLeft} days left`}`}
        rows={leaderboard.map((row) => ({
          key: row.userId,
          name: nameOf(row.userId),
          points: row.points,
          watch: lowest?.userId === row.userId,
        }))}
        note={alone ? "Just you so far. Invite your flatmates below and the race is on." : undefined}
        stub={
          <>
            <p className="text-sm">Lowest score on {month.lastDay} {month.name}:</p>
            <p className="break-words text-lg font-semibold">{flat.forfeit}</p>
          </>
        }
      />

      <div className="mt-8 space-y-10 px-4 sm:px-0">
        <section aria-labelledby="log-title">
          <h2 id="log-title" className="text-xl font-semibold tracking-tight">
            Log a chore
          </h2>
          <p className="mb-4 mt-1 text-muted">Credit for what you did, or kudos for a flatmate who covered for you.</p>
          <ChoreForm members={members.map((m) => ({ userId: m.user_id, name: m.display_name }))} me={me} />
        </section>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="text-xl font-semibold tracking-tight">
            Recent chores
          </h2>
          {chores.length === 0 ? (
            <p className="mt-2 text-muted">Nothing logged yet. Did the dishes today? Log it above.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {chores.map((chore) => (
                <li key={chore.id} data-testid="core-item" className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{chore.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <span>{nameOf(chore.done_by)}</span>
                      {chore.user_id !== chore.done_by && (
                        <span className="rounded bg-accent-soft px-1.5 text-xs font-medium text-accent-ink">
                          Kudos from {nameOf(chore.user_id).replace(/^You$/, "you")}
                        </span>
                      )}
                      <span>{timeAgo(chore.created_at)}</span>
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-accent-ink tabular-nums">+{chore.points}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-6 border-t border-border pt-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{alone ? "Invite your flatmates" : "Your flat"}</h2>
            <p className="mt-1 text-sm text-muted">
              Send them the link, or have them type the code on their board after signing up.
            </p>
            <p
              className="mt-3 text-3xl font-semibold tracking-[0.25em] tabular-nums"
              aria-label={`Flat code ${flat.join_code.split("").join(" ")}`}
            >
              {flat.join_code}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={inviteLink} label="Copy invite link" />
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer"
                className={buttonLooks.secondary}
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
        </section>
      </div>
    </main>
  );
}
