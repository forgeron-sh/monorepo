// Sizes and stamps written for people: one place, so a file size reads the same in a form field,
// a Drive row and a chat attachment.

import { formatShort } from "./dates";

export interface FormatBytesOptions {
  /**
   * `1000` (default) for storage and transfer, as drives and clouds count; `1024` for the size
   * of a file on a disk or in a form, as `File.size` is usually meant.
   */
  base?: 1000 | 1024;
}

/**
 * A size in bytes for people: `840 B`, `12 KB`, `3.1 MB`, `5 MB`. One decimal under 10 (none when
 * round), none above. A dash when the size is unknown.
 */
export function formatBytes(
  bytes: number | null | undefined,
  { base = 1000 }: FormatBytesOptions = {},
): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return "—";
  if (bytes < base) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / base;
  let unit = 0;
  while (value >= base && unit < units.length - 1) {
    value /= base;
    unit += 1;
  }
  const text = value >= 10 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1);
  return `${text} ${units[unit]}`;
}

/**
 * A date and time `YYYY-MM-DD HH:mm` (or a date alone) for a dense row: the time when it is
 * `today`, else the day, with the year when it is not this year's.
 */
export function formatWhen(value: string | undefined, today?: string): string {
  if (!value) return "—";
  const [day, time] = value.split(/[ T]/);
  if (!day) return value;
  if (today && day === today) return time ? time.slice(0, 5) : "Today";
  const year = today ? Number(today.slice(0, 4)) : undefined;
  return formatShort(day, year);
}

export interface FormatDurationOptions {
  /** Past a minute, write whole minutes (`2 min`) rather than minutes and seconds (`2 min 05 s`). */
  compact?: boolean;
}

/**
 * A span in milliseconds for people: `120 ms`, `1.4 s`, `12 s`, `2 min 05 s` (`2 min` when
 * `compact`). A dash when unknown.
 */
export function formatDuration(
  ms: number | undefined,
  { compact = false }: FormatDurationOptions = {},
): string {
  if (ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  if (compact) return `${Math.round(ms / 60_000)} min`;
  const min = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${min} min ${String(s).padStart(2, "0")} s`;
}
