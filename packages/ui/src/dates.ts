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
