import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChoreActions } from "@/components/chore-actions";
import { ChoreForm } from "@/components/chore-form";
import { CopyButton } from "@/components/copy-button";
import { type Duty, DutiesSection } from "@/components/duties-section";
import { type Nudge, NudgeBanner } from "@/components/nudge-banner";
import { ForfeitForm } from "@/components/forfeit-form";
import { JoinForm } from "@/components/join-form";
import { LeaderboardSlab } from "@/components/leaderboard-slab";
import { NameForm } from "@/components/name-form";
import { buttonLooks, Panel } from "@/components/ui";
import { cleanJoinCode } from "@/lib/form-state";
import { currentMonth, currentWeek, isWithinHours, madridDay, timeAgo } from "@/lib/month";
import { repeatKey } from "@/lib/points";
import { createClient, getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your board · Choreboard" };

// Personal data: never prerender or cache this page.
export const dynamic = "force-dynamic";

type Member = { user_id: string; display_name: string };
type Chore = { id: string; title: string; points: number; done_by: string; user_id: string; created_at: string };
type ForfeitChange = { id: string; changed_by: string | null; forfeit: string; created_at: string };

export default async function BoardPage({ searchParams }: PageProps<"/app">) {
  const supabase = await createClient();
  const me = await getUserId(supabase);
  if (!me) redirect("/login");

  const month = currentMonth();
  const week = currentWeek();
  const { join } = await searchParams;
  const inviteCode = cleanJoinCode(join);

  // RLS scopes every read to the caller's own flat (nudges: only ones I sent or received).
  const [
    flatResult,
    membersResult,
    recentResult,
    monthResult,
    forfeitResult,
    dutiesResult,
    weekDutyChoresResult,
    nudgesResult,
  ] = await Promise.all([
    supabase.from("flats").select("id, name, join_code, forfeit").single(),
    supabase.from("flat_members").select("user_id, display_name").order("joined_at"),
    supabase
      .from("chores")
      .select("id, title, points, done_by, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("chores")
      .select("done_by, points, title, category, created_at")
      .gte("created_at", month.startIso),
    supabase
      .from("forfeit_changes")
      .select("id, changed_by, forfeit, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("duties").select("id, title, assignee, weekday"),
    supabase
      .from("chores")
      .select("duty_id, done_by, created_at")
      .not("duty_id", "is", null)
      .gte("created_at", week.startIso)
      .order("created_at"),
    supabase
      .from("nudges")
      .select("id, duty_id, from_user, to_user, nudge_day")
      .gte("created_at", week.startIso)
      .order("created_at", { ascending: false }),
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

  // Sorted by name so "Who did it?" and ties keep the same order on every load.
  const members: Member[] = (membersResult.data ?? []).sort((a, b) => a.display_name.localeCompare(b.display_name));
  const chores: Chore[] = recentResult.data ?? [];
  const names = new Map(members.map((member) => [member.user_id, member.display_name]));
  const nameOf = (userId: string | null) =>
    userId === me ? "You" : ((userId && names.get(userId)) ?? "A former flatmate");

  const scores = new Map(members.map((member) => [member.user_id, 0]));
  for (const chore of monthResult.data ?? []) {
    if (scores.has(chore.done_by)) scores.set(chore.done_by, (scores.get(chore.done_by) ?? 0) + chore.points);
  }
  const leaderboard = [...scores.entries()]
    .map(([userId, points]) => ({ userId, points }))
    .sort((a, b) => b.points - a.points);
  // Only a clear last place is on forfeit watch: nobody gets tagged at a tie, including a
  // newcomer at 0 points.
  const last = leaderboard[leaderboard.length - 1];
  const secondLast = leaderboard[leaderboard.length - 2];
  const lowest = last && secondLast && last.points < secondLast.points ? last : null;

  // What already earned points today, per flatmate, so the form can warn before a repeat
  // that the once-a-day brake will log for 0.
  const today = madridDay();
  const countedToday: Record<string, string[]> = {};
  for (const chore of monthResult.data ?? []) {
    if (chore.points > 0 && madridDay(chore.created_at) === today) {
      (countedToday[chore.done_by] ??= []).push(repeatKey(chore.title, chore.category));
    }
  }

  // Forfeit changes sit in the feed between the chores. Older than the oldest chore shown
  // would put them out of context, so those are left out.
  const forfeitChanges: ForfeitChange[] = forfeitResult.data ?? [];
  const lastForfeitChange = forfeitChanges[0];
  const feedStart = chores.length === 50 ? chores[chores.length - 1].created_at : "";
  const feed = [
    ...chores.map((chore) => ({ kind: "chore" as const, at: chore.created_at, chore })),
    ...forfeitChanges
      .filter((change) => change.created_at >= feedStart)
      .map((change) => ({ kind: "forfeit" as const, at: change.created_at, change })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const host = (await headers()).get("host") ?? "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const inviteLink = `${protocol}://${host}/join/${flat.join_code}`;
  const whatsappText = encodeURIComponent(`Join our flat on Choreboard: ${inviteLink}`);
  const alone = members.length <= 1;
  const showInvitePrompt = inviteCode && inviteCode !== flat.join_code;
  const memberOptions = members.map((m) => ({ userId: m.user_id, name: m.display_name }));

  // Duties: the first entry logged against a duty this week is what counts as done.
  const duties: Duty[] = dutiesResult.data ?? [];
  const dutyById = new Map(duties.map((duty) => [duty.id, duty]));
  const doneBy = new Map<string, string>();
  for (const chore of weekDutyChoresResult.data ?? []) {
    if (chore.duty_id && !doneBy.has(chore.duty_id)) doneBy.set(chore.duty_id, chore.done_by);
  }
  const nudges = nudgesResult.data ?? [];
  const nudgedToday = new Set(
    nudges.filter((nudge) => nudge.from_user === me && nudge.nudge_day === today).map((nudge) => nudge.duty_id),
  );
  // Only nudges still worth acting on: about my duties that nobody has ticked off yet.
  const myNudges: Nudge[] = nudges.filter(
    (nudge) => nudge.to_user === me && !doneBy.has(nudge.duty_id) && dutyById.get(nudge.duty_id)?.assignee === me,
  );

  // One line of race commentary under the board: who you're chasing, or how far ahead you are.
  const standing = alone ? undefined : raceLine(leaderboard, me, nameOf, month.daysLeft);

  return (
    <main className="mx-auto w-full max-w-3xl pb-16 sm:px-4 sm:pt-6">
      {showInvitePrompt && (
        <section className="mx-4 my-4 rounded-xl bg-accent-soft p-4 sm:mx-0 sm:mt-0 sm:p-5">
          <h2 className="text-lg font-semibold">You were invited to a flat</h2>
          <p className="mt-1 text-sm text-muted">Join it to share one board with your flatmates.</p>
          <div className="mt-3">
            <JoinForm defaultCode={inviteCode} alone={alone} currentCode={flat.join_code} />
          </div>
        </section>
      )}

      <NudgeBanner nudges={myNudges} duties={dutyById} nameOf={nameOf} />

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
        note={alone ? "Just you so far. Invite your flatmates below and the race is on." : standing}
        stub={
          <>
            <p className="text-sm">Lowest score on {month.lastDay} {month.name}:</p>
            <p className="break-words text-lg font-semibold">{flat.forfeit}</p>
            {lastForfeitChange && (
              <p className="mt-1 text-sm">
                Set by {nameOf(lastForfeitChange.changed_by).replace(/^You$/, "you")},{" "}
                {timeAgo(lastForfeitChange.created_at)}
              </p>
            )}
          </>
        }
      />

      <div className="mt-8 space-y-10 px-4 sm:px-0">
        <DutiesSection
          duties={duties}
          doneBy={doneBy}
          nudgedToday={nudgedToday}
          members={memberOptions}
          me={me}
          today={week.weekday}
          nameOf={nameOf}
        />

        <section aria-labelledby="log-title">
          <h2 id="log-title" className="text-xl font-semibold tracking-tight">
            Log a chore
          </h2>
          <p className="mb-4 mt-1 text-muted">Credit for what you did, or kudos for a flatmate who covered for you.</p>
          <ChoreForm
            members={memberOptions}
            me={me}
            countedToday={countedToday}
          />
        </section>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="text-xl font-semibold tracking-tight">
            Recent chores
          </h2>
          {chores.length === 0 ? (
            <p className="mt-2 text-muted">Nothing logged yet. Did the dishes today? Log it above.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {feed.map((item) =>
                item.kind === "forfeit" ? (
                  // Not a chore, so no core-item: the grading bot counts only saved chores.
                  <li key={item.change.id} className="py-3">
                    <p className="break-words">
                      <span className="font-medium">{nameOf(item.change.changed_by)}</span> changed the forfeit to
                      &ldquo;{item.change.forfeit}&rdquo;
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <span className="rounded bg-stub px-1.5 text-xs font-medium text-stub-foreground">Forfeit</span>
                      <span>{timeAgo(item.change.created_at)}</span>
                    </p>
                  </li>
                ) : (
                  <ChoreRow key={item.chore.id} chore={item.chore} me={me} nameOf={nameOf} />
                ),
              )}
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
            <p className="mt-1 break-all text-sm text-muted">{inviteLink}</p>
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
          <NameForm key={names.get(me) ?? ""} current={names.get(me) ?? ""} />
          {/* Keyed so the field shows the new value after joining another flat or after a
              flatmate changes it, instead of keeping a stale one that Save would write back. */}
          <ForfeitForm key={`${flat.id}:${flat.forfeit}`} flatId={flat.id} current={flat.forfeit} />
          {!showInvitePrompt && <JoinForm alone={alone} currentCode={flat.join_code} />}
        </section>
      </div>
    </main>
  );
}

function ChoreRow({ chore, me, nameOf }: { chore: Chore; me: string; nameOf: (userId: string | null) => string }) {
  const kudos = chore.user_id !== chore.done_by;
  // Same rules as the chores delete policy; the database checks them again.
  const action =
    chore.user_id === me && isWithinHours(chore.created_at, 24)
      ? "remove"
      : kudos && chore.done_by === me
        ? "decline"
        : null;

  return (
    <li data-testid="core-item" className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-medium">{chore.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>{nameOf(chore.done_by)}</span>
            {kudos && (
              <span className="rounded bg-accent-soft px-1.5 text-xs font-medium text-accent-ink">
                Kudos from {nameOf(chore.user_id).replace(/^You$/, "you")}
              </span>
            )}
            {chore.points === 0 && <span>Already counted today</span>}
            <span>{timeAgo(chore.created_at)}</span>
          </p>
        </div>
        <span className="shrink-0 font-semibold text-accent-ink tabular-nums">+{chore.points}</span>
      </div>
      {action && <ChoreActions choreId={chore.id} kind={action} />}
    </li>
  );
}

// "2 points behind Priya, 3 days left." Encouraging, never a dig at anyone.
function raceLine(
  leaderboard: { userId: string; points: number }[],
  me: string,
  nameOf: (userId: string | null) => string,
  daysLeft: number,
) {
  const index = leaderboard.findIndex((row) => row.userId === me);
  if (index < 0 || leaderboard.length < 2) return undefined;

  const left = daysLeft === 0 ? "last day of the month" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
  const mine = leaderboard[index].points;
  const points = (n: number) => `${n} ${n === 1 ? "point" : "points"}`;

  if (index === 0) {
    const next = leaderboard[1];
    if (next.points === mine) return `Level with ${nameOf(next.userId)} at the top, ${left}.`;
    return `You lead by ${points(mine - next.points)}, ${left}.`;
  }

  const ahead = leaderboard[index - 1];
  if (ahead.points === mine) return `Level with ${nameOf(ahead.userId)}, ${left}.`;
  return `${points(ahead.points - mine)} behind ${nameOf(ahead.userId)}, ${left}.`;
}
