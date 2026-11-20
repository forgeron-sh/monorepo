// Calendar dates as `YYYY-MM-DD` strings in local time: no time zone, no time of day, nothing to
// shift when the value travels between server, client and database.

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/** The same day `months` later, kept inside the target month (Jan 31 + 1 → Feb 28). */
export function addMonths(iso: string, months: number): string {
  const date = parseIso(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return toIso(date);
}

/** 0 for Monday … 6 for Sunday. */
export const weekday = (iso: string) => (parseIso(iso).getDay() + 6) % 7;

/** The 42 days shown for a month: six weeks from the Monday on or before the 1st. */
export function monthGrid(year: number, month: number): string[] {
  const first = toIso(new Date(year, month, 1));
  const start = addDays(first, -weekday(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** "Nov 18", with the year when it is not `thisYear`. */
export function formatShort(iso: string, thisYear?: number): string {
  const date = parseIso(iso);
  const text = `${MONTHS[date.getMonth()]!.slice(0, 3)} ${date.getDate()}`;
  return thisYear === undefined || date.getFullYear() === thisYear
    ? text
    : `${text}, ${date.getFullYear()}`;
}

/** "Wednesday 18 November 2026": the name of a day for assistive technology. */
export function formatLong(iso: string): string {
  const date = parseIso(iso);
  return `${WEEKDAYS[weekday(iso)]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "45 min", "1 h", "1 h 30", "2 h": a duration in words. */
export function formatMinutes(total: number): string {
  const t = Math.max(0, Math.round(total));
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/* ---- stamps: dates and datetimes read by their day */

const DAY_STAMP = /^(\d{4})-(\d{2})-(\d{2})/;

/** The `YYYY-MM-DD` of a stamp (`2026-11-18`, `2026-11-18T09:12:00Z`, `2026-11-18 09:12`), or null. */
export function adminDay(stamp: string | null | undefined): string | null {
  const m = stamp ? DAY_STAMP.exec(stamp) : null;
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Whole days from one day to another (negative when `to` is earlier); null when a stamp is not a date. */
export function adminDaysBetween(from: string, to: string): number | null {
  const a = adminDay(from);
  const b = adminDay(to);
  if (!a || !b) return null;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** "Nov 18", with the year when it is not `thisYear`; the text itself when it is not a date. */
export function formatAdminDate(stamp: string, thisYear?: number): string {
  const day = adminDay(stamp);
  return day ? formatShort(day, thisYear) : stamp;
}

/** "today", "yesterday", "3 days ago", "in 2 days": a day told from `today`. */
export function relativeDay(stamp: string, today: string): string {
  const n = adminDaysBetween(today, stamp);
  if (n === null) return stamp;
  if (n === 0) return "today";
  if (n === -1) return "yesterday";
  if (n === 1) return "tomorrow";
  return n < 0 ? `${-n} days ago` : `in ${n} days`;
}

/** "Today · Nov 18", "Yesterday · Nov 17", else "Nov 2": the name of a day over a group of rows. */
export function dayLabel(day: string, today?: string): string {
  if (today && day === today) return `Today · ${formatShort(day)}`;
  if (today && day === addDays(today, -1)) return `Yesterday · ${formatShort(day)}`;
  return formatShort(day, today ? parseIso(today).getFullYear() : undefined);
}

/** Splits a list by the day of each item's stamp (`YYYY-MM-DD…`), keeping order; a run of one day is one group. */
export function groupByDay<T>(
  items: ReadonlyArray<T>,
  stamp: (item: T) => string,
): { day: string; items: T[] }[] {
  const days: { day: string; items: T[] }[] = [];
  for (const item of items) {
    const day = stamp(item).slice(0, 10);
    const last = days[days.length - 1];
    if (last?.day === day) last.items.push(item);
    else days.push({ day, items: [item] });
  }
  return days;
}
