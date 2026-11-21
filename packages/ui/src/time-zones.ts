// Time zones read through Intl: the wall clock of a zone at a moment, its offset from UTC, a list of
// zones and how to name one. Pure, no clock, React or DOM. The time blocks re-export it.

const pad = (n: number) => String(n).padStart(2, "0");

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
