// Months follow Madrid time, where the first users live, so "this month" flips at
// midnight local time rather than UTC.
const TIME_ZONE = "Europe/Madrid";

export function currentMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZoneName: "longOffset",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  // "GMT+02:00" -> "+02:00". This is today's offset: in a month where daylight saving
  // changes, the start shifts by an hour, which only affects chores logged 00:00-01:00 on the 1st.
  const offset = get("timeZoneName").replace("GMT", "") || "+00:00";

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startIso = `${year}-${String(month).padStart(2, "0")}-01T00:00:00${offset}`;
  const name = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, month: "long" }).format(now);

  return { startIso, name, lastDay: daysInMonth, daysLeft: daysInMonth - day };
}

export function timeAgo(iso: string, now = new Date()) {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

// "2026-10-21" in Madrid time: the day the once-a-day points brake counts in.
export function madridDay(date: Date | string = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(date));
}

// Matches the 24-hour window in the chores delete policy.
export function isWithinHours(iso: string, hours: number, now = new Date()) {
  return now.getTime() - new Date(iso).getTime() < hours * 3_600_000;
}
