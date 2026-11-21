// Dates: a reference of the kind `date`, an inline chip typed with `!`. The id is the ISO day
// (`2026-11-20`) with an optional time (`2026-11-20T14:30`), the label what the app's `format`
// wrote. Core half: the pure date helpers, Markdown (`[Label](ref:date:2026-11-20)`), plain text
// and the static view (a `<time>`). Days are `YYYY-MM-DD` and times `HH:mm`, with no time zone.

import { definePlugin } from "../core/plugin";
import { el } from "../core/view";
import { decorateKind, referenceAttrs } from "./references-kit";

export interface DateParts {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`, 24 hours. */
  time?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A real calendar day written `YYYY-MM-DD` (not `2026-02-31`). */
export function isDateString(value: string): boolean {
  const hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!hit) return false;
  const [y, m, d] = [Number(hit[1]), Number(hit[2]), Number(hit[3])];
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/** A time of day written `HH:mm`, 24 hours. */
export function isTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** The id of a date reference: `2026-11-20`, or `2026-11-20T14:30` with a time. */
export const dateId = ({ date, time }: DateParts): string => (time ? `${date}T${time}` : date);

/** What an id says, or `undefined` when it is not a day with an optional time. */
export function parseDateId(id: string): DateParts | undefined {
  const [date = "", time, ...rest] = id.split("T");
  if (rest.length || !isDateString(date)) return undefined;
  if (time === undefined) return { date };
  return isTimeString(time) ? { date, time } : undefined;
}

/** The default label of a date: `2026-11-20`, or `2026-11-20 14:30`. Apps pass their own `format`. */
export const defaultDateLabel = ({ date, time }: DateParts): string =>
  time ? `${date} ${time}` : date;

/** A device date as `YYYY-MM-DD`, in local time. */
export const toDateString = (value: Date): string =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

/** The day `days` after (or before, when negative) a `YYYY-MM-DD` day. */
export function addDaysTo(date: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** 0 for Monday … 6 for Sunday. */
const weekdayOf = (date: string): number => {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
};

/**
 * Is it over? A day is past once it is before today; a day with a time, once that moment has gone.
 * Pure for a given `now`: pass it as the `isPast` option of the plugin.
 */
export function isPastDate(parts: DateParts, now: Date = new Date()): boolean {
  const today = toDateString(now);
  if (parts.date !== today || !parts.time) return parts.date < today;
  return parts.time < `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * What a typed shortcut means, from `today` (`YYYY-MM-DD`): `today`, `tomorrow`, `yesterday`,
 * `nextweek`, a weekday (`friday`, the next one, never today), `+3` days, `-2`, or a typed ISO day
 * with an optional time (`2026-12-01`, `2026-12-01T14:30`). `undefined` for anything else.
 */
export function dateShortcut(query: string, today: string): DateParts | undefined {
  const q = query
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+(?=[a-z])/g, "");
  if (q === "today" || q === "now") return { date: today };
  if (q === "tomorrow") return { date: addDaysTo(today, 1) };
  if (q === "yesterday") return { date: addDaysTo(today, -1) };
  if (q === "nextweek") return { date: addDaysTo(today, 7) };
  const day = DAY_NAMES.indexOf(q);
  if (day !== -1) {
    const ahead = (day - weekdayOf(today) + 7) % 7;
    return { date: addDaysTo(today, ahead === 0 ? 7 : ahead) };
  }
  const offset = /^([+-])(\d{1,4})d?$/.exec(q);
  if (offset) return { date: addDaysTo(today, Number(offset[2]) * (offset[1] === "-" ? -1 : 1)) };
  return parseDateId(query.trim().toUpperCase());
}

export interface DatesCoreOptions {
  /** Marks the chip `fg-rt-past` when it returns `true` (an overdue date). Pure. Default: never. */
  isPast?: (parts: DateParts) => boolean;
}

/** The core half of the dates plugin. */
export function datesPlugin(options: DatesCoreOptions = {}) {
  return definePlugin({
    id: "dates",
    name: "Dates",
    description: "Inline dates, with an optional time, typed with `!`.",
    requires: ["references"],
    decorate: decorateKind("date", {
      text: (ref) => ref.label,
      render: (ref, fallback) => {
        const parts = parseDateId(ref.id);
        // An id that is not a date is shown as the generic chip, never as a broken `<time>`.
        if (!parts) return fallback();
        const past = options.isPast?.(parts) === true;
        return [
          el(
            "time",
            {
              class: `fg-rt-mention fg-rt-date${past ? " fg-rt-past" : ""}`,
              datetime: dateId(parts),
              ...referenceAttrs(ref),
            },
            [ref.label],
          ),
        ];
      },
    }),
  });
}

export const dates = datesPlugin();
