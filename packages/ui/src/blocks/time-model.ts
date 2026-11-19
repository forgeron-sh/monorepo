// The pure side of the "time" blocks: minutes of a day, snapping, the columns of overlapping
// events, hours of availability and the slots they give, a small recurrence (a subset of RRULE)
// and time zones read through Intl. Dates are `YYYY-MM-DD`, times `HH:mm`, neither with a zone:
// a zone is always named next to them. Nothing here touches the clock, React or the DOM.

import { addDays, addMonths, formatShort, parseIso, WEEKDAYS, weekday } from "../dates";

const pad = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------------ minutes of a day */

const DAY_MINUTES = 1440;

/** A span of one day: `start` and `end` as `HH:mm`; `24:00` is the end of the day. */
export interface TimeSpan {
  start: string;
  end: string;
}

/** `HH:mm` to minutes since midnight (`24:00` is 1440), or null for anything else. */
export function toMinutes(time: string | null | undefined): number | null {
  if (time === "24:00") return DAY_MINUTES;
  const hit = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  if (!hit) return null;
  const h = Number(hit[1]);
  const m = Number(hit[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
}

/** Minutes since midnight to `HH:mm`, kept between `00:00` and `24:00`. */
export function fromMinutes(total: number): string {
  const t = Math.max(0, Math.min(DAY_MINUTES, Math.round(total)));
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

/** Minutes brought to the nearest step (15 by default); `floor` and `ceil` pick a side. */
export function snapMinutes(
  minutes: number,
  step = 15,
  mode: "round" | "floor" | "ceil" = "round",
): number {
  const s = Math.max(1, Math.floor(step));
  const f = mode === "floor" ? Math.floor : mode === "ceil" ? Math.ceil : Math.round;
  return f(minutes / s) * s;
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** "45 min", "1 h", "1 h 30", "2 h": a duration in words. */
export function formatMinutes(total: number): string {
  const t = Math.max(0, Math.round(total));
  const h = Math.floor(t / 60);
  const m = t % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${pad(m)}`;
}

/** "1h30", "90", "90 min", "1.5h", "2 h" read as minutes, or null when it says nothing. */
export function parseMinutes(text: string): number | null {
  const s = text.trim().toLowerCase().replace(",", ".");
  if (s === "") return null;
  const hm = /^(\d+)\s*(?:h|:)\s*(\d{1,2})?\s*(?:m|min)?$/.exec(s);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2] ?? 0);
  const hours = /^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/.exec(s);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const mins = /^(\d+)\s*(?:m|min|mins|minutes?)?$/.exec(s);
  return mins ? Number(mins[1]) : null;
}

/** The two spans share some time (touching ends do not overlap). */
const spansOverlap = (a: TimeSpan, b: TimeSpan) => {
  const [as, ae, bs, be] = [
    toMinutes(a.start),
    toMinutes(a.end),
    toMinutes(b.start),
    toMinutes(b.end),
  ];
  if (as === null || ae === null || bs === null || be === null) return false;
  return as < be && bs < ae;
};

/* ------------------------------------------------------------------ overlap columns */

export interface Placed<T> {
  item: T;
  start: number;
  end: number;
  /** The column the item takes among those that overlap it, from 0. */
  column: number;
  /** How many columns the cluster of overlapping items needs. */
  columns: number;
}

/**
 * Lays out events of one day side by side: items that overlap, directly or through others, share
 * the width of their cluster; an item takes the first column that is free when it starts.
 */
export function layoutOverlaps<T>(
  items: ReadonlyArray<T>,
  range: (item: T) => { start: number; end: number },
): Placed<T>[] {
  const sorted = items
    .map((item) => {
      const r = range(item);
      return { item, start: r.start, end: Math.max(r.end, r.start + 1) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let ends: number[] = [];
  let clusterEnd = -Infinity;
  const close = () => {
    for (const p of cluster) p.columns = ends.length;
    cluster = [];
    ends = [];
  };
  for (const s of sorted) {
    if (s.start >= clusterEnd) close();
    let column = ends.findIndex((e) => e <= s.start);
    if (column === -1) {
      column = ends.length;
      ends.push(s.end);
    } else ends[column] = s.end;
    const placed: Placed<T> = { ...s, column, columns: 1 };
    cluster.push(placed);
    out.push(placed);
    clusterEnd = Math.max(clusterEnd === -Infinity ? s.end : clusterEnd, s.end);
  }
  close();
  return out;
}

/* ------------------------------------------------------------------ days of a view */

export type GridView = "day" | "workweek" | "week";

/** The days a view shows around `date`: the day, Monday to Friday, or Monday to Sunday. */
export function viewDays(date: string, view: GridView): string[] {
  if (view === "day") return [date];
  const monday = addDays(date, -weekday(date));
  return Array.from({ length: view === "week" ? 7 : 5 }, (_, i) => addDays(monday, i));
}

/** The day in focus after "previous" (-1) or "next" (1): a day, or a week. */
export const stepView = (date: string, view: GridView, by: number) =>
  addDays(date, view === "day" ? by : by * 7);

/* ------------------------------------------------------------------ availability */

/** An exception to the weekly hours: the whole day off, or other hours for that date. */
export interface AvailabilityException {
  /** `YYYY-MM-DD`. */
  date: string;
  kind: "off" | "hours";
  /** The hours of a `hours` exception. */
  spans: TimeSpan[];
  note?: string;
}

/** When someone, or something, can be booked: weekly hours (Monday first) and exceptions. */
export interface Availability {
  /** An IANA time zone, e.g. `Europe/Paris`: the hours are read in it. */
  timezone: string;
  /** Seven lists of spans, Monday first; an empty list is a day off. */
  weekly: TimeSpan[][];
  exceptions: AvailabilityException[];
}

/** Nine to five on weekdays. */
export function defaultWeekly(): TimeSpan[][] {
  return Array.from({ length: 7 }, (_, i) => (i < 5 ? [{ start: "09:00", end: "17:00" }] : []));
}

/** The spans open on a date: its exception when there is one, else the hours of its weekday. */
export function spansOn(date: string, a: Pick<Availability, "weekly" | "exceptions">): TimeSpan[] {
  const exception = a.exceptions.find((e) => e.date === date);
  if (exception) return exception.kind === "off" ? [] : exception.spans;
  return a.weekly[weekday(date)] ?? [];
}

/** One message per span: empty or inverted, or overlapping an earlier one; null when fine. */
export function spanErrors(spans: ReadonlyArray<TimeSpan>): (string | null)[] {
  return spans.map((s, i) => {
    const a = toMinutes(s.start);
    const b = toMinutes(s.end);
    if (a === null || b === null) return "Choose a start and an end";
    if (b <= a) return "The end must be after the start";
    if (spans.slice(0, i).some((o) => spansOverlap(o, s))) return "Overlaps another range";
    return null;
  });
}

/** Valid spans, sorted, with the overlapping or touching ones merged. */
export function normalizeSpans(spans: ReadonlyArray<TimeSpan>): TimeSpan[] {
  const list = spans
    .map((s) => ({ a: toMinutes(s.start), b: toMinutes(s.end) }))
    .filter((s): s is { a: number; b: number } => s.a !== null && s.b !== null && s.b > s.a)
    .sort((x, y) => x.a - y.a);
  const out: { a: number; b: number }[] = [];
  for (const s of list) {
    const last = out[out.length - 1];
    if (last && s.a <= last.b) last.b = Math.max(last.b, s.b);
    else out.push({ ...s });
  }
  return out.map((s) => ({ start: fromMinutes(s.a), end: fromMinutes(s.b) }));
}

/** The minutes the valid spans cover. */
export const totalMinutes = (spans: ReadonlyArray<TimeSpan>) =>
  normalizeSpans(spans).reduce((n, s) => n + (toMinutes(s.end)! - toMinutes(s.start)!), 0);

/** The first free span of an hour or more after the last one, for a new range. */
export function nextSpan(spans: ReadonlyArray<TimeSpan>): TimeSpan {
  const last = Math.max(0, ...normalizeSpans(spans).map((s) => toMinutes(s.end)!));
  if (spans.length === 0) return { start: "09:00", end: "17:00" };
  const start = Math.min(last + 60, DAY_MINUTES - 60);
  return { start: fromMinutes(start), end: fromMinutes(Math.min(start + 120, DAY_MINUTES)) };
}

/* ------------------------------------------------------------------ slots */

/** Time already taken: it blocks the slots that overlap it. */
export interface BusyBlock {
  date: string;
  start: string;
  end: string;
}

/** Why a slot cannot be chosen. */
export type SlotReason = "busy" | "past" | "closed";

export interface SlotItem {
  /** In the zone the slot is shown in. */
  date: string;
  time: string;
  available: boolean;
  reason?: SlotReason;
  /** The same moment where the hours were written. */
  host: { date: string; time: string; timezone: string };
}

/** A slot given as it is, instead of computed from hours: in the host's zone. */
export interface TimeSlot {
  date: string;
  time: string;
  /** `false` for a slot that is taken. Default `true`. */
  available?: boolean;
}

/**
 * The starts that fit in the open spans of a date, every `interval` minutes, for a visit of
 * `duration` minutes; busy blocks make a slot unavailable.
 */
export function daySlots(
  date: string,
  a: Pick<Availability, "weekly" | "exceptions">,
  busy: ReadonlyArray<BusyBlock>,
  duration: number,
  interval: number,
): TimeSlot[] {
  const out: TimeSlot[] = [];
  const taken = busy.filter((b) => b.date === date);
  for (const span of normalizeSpans(spansOn(date, a))) {
    const end = toMinutes(span.end)!;
    for (let t = toMinutes(span.start)!; t + duration <= end; t += Math.max(1, interval)) {
      const clash = taken.some((b) => {
        const bs = toMinutes(b.start);
        const be = toMinutes(b.end);
        return bs !== null && be !== null && t < be && bs < t + duration;
      });
      out.push({ date, time: fromMinutes(t), available: !clash });
    }
  }
  return out;
}

/**
 * The slots of one day as a person in `timezone` sees them: the host's slots of the day before,
 * of the day and of the day after, moved to that zone and kept when they land on `date`. Past
 * slots (before `now`, a local `YYYY-MM-DDTHH:mm` in that zone) are unavailable.
 */
export function slotsOnDay(
  date: string,
  slots: ReadonlyArray<TimeSlot>,
  hostTimezone: string,
  timezone: string,
  now?: string,
): SlotItem[] {
  const same = hostTimezone === timezone;
  const out: SlotItem[] = [];
  const near = new Set([addDays(date, -1), date, addDays(date, 1)]);
  for (const s of slots) {
    if (!near.has(s.date)) continue;
    const local = same
      ? { date: s.date, time: s.time }
      : convertTime(s.date, s.time, hostTimezone, timezone);
    if (local.date !== date) continue;
    const past = now !== undefined && `${local.date}T${local.time}` < now;
    const free = s.available !== false;
    out.push({
      date: local.date,
      time: local.time,
      available: free && !past,
      ...(!free ? { reason: "busy" as const } : past ? { reason: "past" as const } : {}),
      host: { date: s.date, time: s.time, timezone: hostTimezone },
    });
  }
  return out.sort((x, y) => (x.time < y.time ? -1 : x.time > y.time ? 1 : 0));
}

/* ------------------------------------------------------------------ recurrence (RRULE lite) */

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceEnd =
  | { kind: "never" }
  | { kind: "until"; date: string }
  | { kind: "count"; count: number };

/**
 * A repetition: every `interval` days, weeks, months or years from the first date. A weekly rule
 * names its weekdays (0 Monday to 6 Sunday; the first date's weekday when empty); a monthly one
 * keeps the day of the month of the first date, shortened to the end of a short month.
 */
export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: number[];
  end: RecurrenceEnd;
}

export const FREQUENCY_UNITS: Record<RecurrenceFrequency, [string, string]> = {
  daily: ["day", "days"],
  weekly: ["week", "weeks"],
  monthly: ["month", "months"],
  yearly: ["year", "years"],
};

const MAX_STEPS = 5000;

/**
 * The dates of a recurrence from `start`, between `from` and `to` (both included), at most
 * `limit` of them. The end of the rule (until, count) cuts the list; the count includes the
 * dates before `from`.
 */
export function expandRecurrence(
  rule: Recurrence,
  start: string,
  { from = start, to, limit = 100 }: { from?: string; to?: string; limit?: number } = {},
): string[] {
  const interval = Math.max(1, Math.floor(rule.interval));
  const last = rule.end.kind === "until" ? rule.end.date : undefined;
  const cap = rule.end.kind === "count" ? Math.max(0, Math.floor(rule.end.count)) : Infinity;
  const days = rule.weekdays?.length
    ? [...new Set(rule.weekdays)].sort((a, b) => a - b)
    : [weekday(start)];
  const out: string[] = [];
  let seen = 0;
  // Returns true to stop.
  const take = (date: string): boolean => {
    if (date < start) return false;
    if (seen >= cap || (last !== undefined && date > last) || (to !== undefined && date > to)) {
      return true;
    }
    seen++;
    if (date >= from) out.push(date);
    return out.length >= limit;
  };
  const monday = addDays(start, -weekday(start));
  for (let k = 0; k < MAX_STEPS; k++) {
    if (rule.frequency === "daily") {
      if (take(addDays(start, k * interval))) break;
    } else if (rule.frequency === "weekly") {
      const week = addDays(monday, 7 * interval * k);
      let stop = false;
      for (const d of days) {
        if (take(addDays(week, d))) {
          stop = true;
          break;
        }
      }
      if (stop) break;
    } else if (rule.frequency === "monthly") {
      if (take(addMonths(start, k * interval))) break;
    } else if (take(addMonths(start, 12 * k * interval))) break;
  }
  return out;
}

/** The next `count` dates strictly after `after`. */
export const nextOccurrences = (rule: Recurrence, start: string, after: string, count: number) =>
  expandRecurrence(rule, start, { from: addDays(after, 1), limit: count });

const ordinal = (n: number) => {
  const r = n % 100;
  const s = ["th", "st", "nd", "rd"];
  return `${n}${s[(r - 20) % 10] ?? s[r] ?? s[0]}`;
};

/** "Every 2 weeks on Monday and Wednesday, until Dec 31": the rule in words. */
export function describeRecurrence(rule: Recurrence, start: string): string {
  const n = Math.max(1, Math.floor(rule.interval));
  const [one, many] = FREQUENCY_UNITS[rule.frequency];
  let text = n === 1 ? `Every ${one}` : `Every ${n} ${many}`;
  if (rule.frequency === "daily" && n === 1) text = "Every day";
  if (rule.frequency === "weekly") {
    const days = (rule.weekdays?.length ? [...new Set(rule.weekdays)] : [weekday(start)]).sort(
      (a, b) => a - b,
    );
    const names = days.map((d) => WEEKDAYS[d]!);
    const list =
      names.length === 1
        ? names[0]!
        : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    text += ` on ${list}`;
  } else if (rule.frequency === "monthly") {
    text += ` on the ${ordinal(parseIso(start).getDate())}`;
  } else if (rule.frequency === "yearly") {
    text += ` on ${formatShort(start)}`;
  }
  if (rule.end.kind === "until") text += `, until ${formatShort(rule.end.date)}`;
  if (rule.end.kind === "count") {
    text += `, ${rule.end.count} ${rule.end.count === 1 ? "time" : "times"}`;
  }
  return text;
}

const RRULE_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const RRULE_FREQ: Record<RecurrenceFrequency, string> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

/** `FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=20261231`: the rule as iCalendar writes it. */
export function recurrenceToRrule(rule: Recurrence): string {
  const parts = [`FREQ=${RRULE_FREQ[rule.frequency]}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${Math.floor(rule.interval)}`);
  if (rule.frequency === "weekly" && rule.weekdays?.length) {
    parts.push(
      `BYDAY=${[...rule.weekdays]
        .sort((a, b) => a - b)
        .map((d) => RRULE_DAYS[d])
        .join(",")}`,
    );
  }
  if (rule.end.kind === "until") parts.push(`UNTIL=${rule.end.date.replaceAll("-", "")}`);
  if (rule.end.kind === "count") parts.push(`COUNT=${Math.floor(rule.end.count)}`);
  return parts.join(";");
}

/** The inverse of `recurrenceToRrule`, for the parts it writes; null for anything else. */
export function parseRrule(text: string): Recurrence | null {
  const map = new Map<string, string>();
  for (const part of text.replace(/^RRULE:/i, "").split(";")) {
    const [k, v] = part.split("=");
    if (k && v) map.set(k.toUpperCase(), v);
  }
  const frequency = (Object.keys(RRULE_FREQ) as RecurrenceFrequency[]).find(
    (f) => RRULE_FREQ[f] === map.get("FREQ")?.toUpperCase(),
  );
  if (!frequency) return null;
  const interval = Number(map.get("INTERVAL") ?? 1);
  if (!Number.isInteger(interval) || interval < 1) return null;
  const rule: Recurrence = { frequency, interval, end: { kind: "never" } };
  const by = map.get("BYDAY");
  if (by) {
    const days = by.split(",").map((d) => RRULE_DAYS.indexOf(d.toUpperCase()));
    if (days.some((d) => d < 0)) return null;
    rule.weekdays = days;
  }
  const until = map.get("UNTIL");
  const count = map.get("COUNT");
  if (until) {
    const hit = /^(\d{4})(\d{2})(\d{2})/.exec(until);
    if (!hit) return null;
    rule.end = { kind: "until", date: `${hit[1]}-${hit[2]}-${hit[3]}` };
  } else if (count) {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) return null;
    rule.end = { kind: "count", count: n };
  }
  return rule;
}

/* ------------------------------------------------------------------ time zones (Intl) */

const FORMATS = new Map<string, Intl.DateTimeFormat>();
function zoneFormat(timezone: string): Intl.DateTimeFormat {
  let f = FORMATS.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    FORMATS.set(timezone, f);
  }
  return f;
}

/** Whether `timezone` is a zone this runtime knows. */
export function isTimezone(timezone: string): boolean {
  try {
    zoneFormat(timezone);
    return true;
  } catch {
    return false;
  }
}

/** The wall clock of a zone at a moment, as a local `YYYY-MM-DD` and `HH:mm`. */
export function zonedParts(timezone: string, utcMs: number): { date: string; time: string } {
  const get: Record<string, number> = {};
  for (const p of zoneFormat(timezone).formatToParts(new Date(utcMs))) {
    if (p.type !== "literal") get[p.type] = Number(p.value);
  }
  const h = (get.hour ?? 0) % 24;
  return {
    date: `${String(get.year).padStart(4, "0")}-${pad(get.month ?? 1)}-${pad(get.day ?? 1)}`,
    time: `${pad(h)}:${pad(get.minute ?? 0)}`,
  };
}

/** Minutes the zone is ahead of UTC at a moment (60 for Paris in winter, -300 for New York). */
export function timezoneOffset(timezone: string, utcMs: number): number {
  const parts = zoneFormat(timezone).formatToParts(new Date(utcMs));
  const get: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") get[p.type] = Number(p.value);
  const asUtc = Date.UTC(
    get.year ?? 1970,
    (get.month ?? 1) - 1,
    get.day ?? 1,
    (get.hour ?? 0) % 24,
    get.minute ?? 0,
    get.second ?? 0,
  );
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/** The moment (UTC milliseconds) when a zone's wall clock reads `date` and `time`. */
export function zonedToUtc(date: string, time: string, timezone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const mins = toMinutes(time) ?? 0;
  const wall = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 0, mins);
  let utc = wall - timezoneOffset(timezone, wall) * 60000;
  const again = timezoneOffset(timezone, utc);
  utc = wall - again * 60000;
  return utc;
}

/** A local date and time in one zone, read in another. */
export function convertTime(
  date: string,
  time: string,
  from: string,
  to: string,
): { date: string; time: string } {
  if (from === to) return { date, time };
  return zonedParts(to, zonedToUtc(date, time, from));
}

/** "UTC+1", "UTC-5", "UTC+5:30", "UTC" from an offset in minutes. */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${pad(m)}` : ""}`;
}

/** The time on a zone's clock, `HH:mm`. */
export const clockIn = (timezone: string, utcMs: number) => zonedParts(timezone, utcMs).time;

const COMMON_ZONES = [
  "UTC",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Africa/Casablanca",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Halifax",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
];

/** Every IANA zone the runtime knows (a short common list where it cannot say), sorted. */
export function listTimezones(): string[] {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  let zones: string[] = [];
  try {
    zones = supported ? supported("timeZone") : [];
  } catch {
    zones = [];
  }
  const all = zones.length ? [...zones] : [...COMMON_ZONES];
  if (!all.includes("UTC")) all.push("UTC");
  return all.sort();
}

/** "America/New York": a zone's name as a person reads it. */
export const zoneName = (timezone: string) => timezone.replaceAll("_", " ");

/* ------------------------------------------------------------------ conflicts of resources */

export interface Booking {
  id: string;
  resource: string;
  /** `YYYY-MM-DD`, first day. */
  start: string;
  /** `YYYY-MM-DD`, last day, included. */
  end: string;
}

/**
 * The bookings that overlap another booking of the same resource, as a map from an id to the ids
 * it clashes with.
 */
export function findConflicts(bookings: ReadonlyArray<Booking>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const by = new Map<string, Booking[]>();
  for (const b of bookings) {
    const list = by.get(b.resource);
    if (list) list.push(b);
    else by.set(b.resource, [b]);
  }
  for (const list of by.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const [a0, a1] = a.end < a.start ? [a.end, a.start] : [a.start, a.end];
        const [b0, b1] = b.end < b.start ? [b.end, b.start] : [b.start, b.end];
        if (a0 <= b1 && b0 <= a1) {
          out.set(a.id, [...(out.get(a.id) ?? []), b.id]);
          out.set(b.id, [...(out.get(b.id) ?? []), a.id]);
        }
      }
    }
  }
  return out;
}
