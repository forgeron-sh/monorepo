// A five-field cron expression, evaluated in a time zone (sdk.md §9). Cloudflare fires its cron
// triggers in UTC; which task is due *in its own zone* is decided here.

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface Parsed {
  minute: Set<number>;
  hour: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
  domAny: boolean;
  dowAny: boolean;
}

function parseField(
  expr: string,
  field: string,
  min: number,
  max: number,
  names: string[] = [],
  offset = 0,
): Set<number> {
  const bad = (why: string) => new Error(`"${expr}" is not a valid cron expression: ${why}.`);
  const value = (token: string): number => {
    const named = names.indexOf(token.toUpperCase());
    const n = named === -1 ? Number(token) : named + offset;
    if (!Number.isInteger(n) || n < min || n > max)
      throw bad(`"${token}" is out of range (${min}-${max})`);
    return n;
  };
  const values = new Set<number>();
  for (const part of field.split(",")) {
    const [range = "", step, extra] = part.split("/");
    if (extra !== undefined || range === "") throw bad(`"${part}" is malformed`);
    const by = step === undefined ? 1 : Number(step);
    if (!Number.isInteger(by) || by < 1)
      throw bad(`the step of "${part}" must be a positive integer`);
    let from: number;
    let to: number;
    if (range === "*" || range === "?") {
      [from, to] = [min, max];
    } else if (range.includes("-")) {
      const [a = "", b = ""] = range.split("-");
      [from, to] = [value(a), value(b)];
      if (from > to) throw bad(`the range "${range}" runs backwards`);
    } else {
      from = value(range);
      to = step === undefined ? from : max;
    }
    for (let v = from; v <= to; v += by) values.add(v);
  }
  return values;
}

export function parseCron(expr: string): Parsed {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`"${expr}" is not a cron expression with five fields.`);
  const [m, h, dom, mon, dow] = fields as [string, string, string, string, string];
  // 7 is Sunday too.
  const days = parseField(expr, dow, 0, 7, DAYS, 0);
  if (days.has(7)) days.add(0);
  return {
    minute: parseField(expr, m, 0, 59),
    hour: parseField(expr, h, 0, 23),
    dom: parseField(expr, dom, 1, 31),
    month: parseField(expr, mon, 1, 12, MONTHS, 1),
    dow: days,
    domAny: dom.startsWith("*") || dom === "?",
    dowAny: dow.startsWith("*") || dow === "?",
  };
}

/** Throws on a time zone that does not exist. */
export function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    minute: "numeric",
    hour: "numeric",
    day: "numeric",
    month: "numeric",
    weekday: "short",
  });
}

export function matchesCron(parsed: Parsed, date: Date, zone: Intl.DateTimeFormat): boolean {
  const parts = Object.fromEntries(zone.formatToParts(date).map((p) => [p.type, p.value]));
  const minute = Number(parts.minute);
  const hour = Number(parts.hour);
  const day = Number(parts.day);
  const month = Number(parts.month);
  const weekday = DAYS.indexOf((parts.weekday ?? "").toUpperCase());

  if (!parsed.minute.has(minute) || !parsed.hour.has(hour) || !parsed.month.has(month))
    return false;
  const byDay = parsed.dom.has(day);
  const byWeekday = parsed.dow.has(weekday);
  // As in cron: when both the day of the month and of the week are restricted, either one matches.
  if (parsed.domAny && parsed.dowAny) return true;
  if (parsed.domAny) return byWeekday;
  if (parsed.dowAny) return byDay;
  return byDay || byWeekday;
}
