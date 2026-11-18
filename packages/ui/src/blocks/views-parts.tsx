// What the timeline and the calendar share: how they read a record (accessors with defaults that
// fit an `IssueItem`), and whole-day arithmetic on `YYYY-MM-DD` strings.

import type { ReactNode } from "react";

/** How a view reads its records. Every accessor has a default that reads the field of that name. */
export interface RecordAccessors<T> {
  /** The key of a record: `record.id` by default. */
  getId?: (record: T) => string;
  /** Its name, also said to assistive technology: `title`, else `name`, else the id. */
  getLabel?: (record: T) => string;
  /** A CSS colour for its mark, e.g. `var(--accent)`: `record.color` by default, else grey. */
  getColor?: (record: T) => string | undefined;
}

const read = (record: unknown, name: string): unknown =>
  record !== null && typeof record === "object"
    ? (record as Record<string, unknown>)[name]
    : undefined;

/** A string field of a record, or undefined. */
export const textField = (record: unknown, name: string): string | undefined => {
  const value = read(record, name);
  return typeof value === "string" && value !== "" ? value : undefined;
};

export interface ResolvedAccessors<T> {
  id: (record: T) => string;
  label: (record: T) => string;
  color: (record: T) => string | undefined;
}

export function resolveAccessors<T>(a: RecordAccessors<T>): ResolvedAccessors<T> {
  const id = a.getId ?? ((r: T) => textField(r, "id") ?? "");
  return {
    id,
    label: a.getLabel ?? ((r: T) => textField(r, "title") ?? textField(r, "name") ?? id(r)),
    color: a.getColor ?? ((r: T) => textField(r, "color")),
  };
}

/**
 * What a row or an item shows by default: the identifier in mono and the title when the record
 * has both (an issue), else the label alone.
 */
export function defaultLabel<T>(record: T, label: string, idClass: string): ReactNode {
  const id = textField(record, "id");
  const title = textField(record, "title");
  if (id && title) {
    return [
      <span key="id" className={idClass}>
        {id}
      </span>,
      <span key="t">{title}</span>,
    ];
  }
  return label;
}

const DAY = 86_400_000;
const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

/** Whole days from `a` to `b` (negative when `b` is earlier), immune to daylight saving. */
export const daysBetween = (a: string, b: string) => Math.round((utc(b) - utc(a)) / DAY);

/** The ISO week number of a day: "W47". */
export function isoWeek(iso: string): number {
  const t = utc(iso);
  const thursday = t + (3 - ((new Date(t).getUTCDay() + 6) % 7)) * DAY;
  const jan1 = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  return 1 + Math.floor((thursday - jan1) / DAY / 7);
}

/** The first day of the month of `iso`. */
export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
