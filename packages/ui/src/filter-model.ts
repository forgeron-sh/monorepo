// The filters of a list view, as data: which fields can be filtered, the filters set, and the
// changes the filter bar makes to them. No React here, so an app can reuse it on the server.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";

/** One value a field can take: a status, a person, a label. */
export interface FilterOption {
  value: string;
  label: string;
  /** The mark before the label, the same as in the pickers: a status glyph, an avatar, a swatch. */
  glyph?: ReactNode;
  /** Mono text at the end of the row: how many records have this value. */
  hint?: string;
}

/** A property the records can be filtered on: Status, Priority, Assignee, Labels. */
export interface FilterField {
  id: string;
  label: string;
  icon: IconDefinition;
  options: ReadonlyArray<FilterOption>;
}

/** `is`: the record has one of the values. `is-not`: it has none of them. */
export type FilterOperator = "is" | "is-not";

/** One filter: a field, how it compares, the values chosen. One filter per field. */
export interface Filter {
  field: string;
  operator: FilterOperator;
  values: ReadonlyArray<string>;
}

/** The words between the field and its values: "is", "is any of", "is not", "is none of". */
export function operatorText(operator: FilterOperator, count: number): string {
  if (operator === "is") return count > 1 ? "is any of" : "is";
  return count > 1 ? "is none of" : "is not";
}

/** Adds or removes one value; the filter goes away with its last value. */
export function toggleFilterValue(
  filters: ReadonlyArray<Filter>,
  field: string,
  value: string,
): Filter[] {
  const current = filters.find((f) => f.field === field);
  if (!current) return [...filters, { field, operator: "is", values: [value] }];
  const values = current.values.includes(value)
    ? current.values.filter((v) => v !== value)
    : [...current.values, value];
  return setFilterValues(filters, field, values);
}

/** Sets the values of a field; an empty list removes its filter. */
export function setFilterValues(
  filters: ReadonlyArray<Filter>,
  field: string,
  values: ReadonlyArray<string>,
): Filter[] {
  if (values.length === 0) return filters.filter((f) => f.field !== field);
  const current = filters.find((f) => f.field === field);
  if (!current) return [...filters, { field, operator: "is", values: [...values] }];
  return filters.map((f) => (f.field === field ? { ...f, values: [...values] } : f));
}

/** Turns "is" into "is not" and back. */
export function toggleFilterOperator(filters: ReadonlyArray<Filter>, field: string): Filter[] {
  return filters.map((f) =>
    f.field === field ? { ...f, operator: f.operator === "is" ? "is-not" : "is" } : f,
  );
}

/**
 * Whether a record passes every filter. `read(field)` gives the record's value for a field: a
 * string, a list (labels), or null for none. Null matches the value `"_"`, the "No assignee" entry.
 */
export function matchesFilters(
  filters: ReadonlyArray<Filter>,
  read: (field: string) => string | ReadonlyArray<string> | null | undefined,
): boolean {
  return filters.every((f) => {
    if (f.values.length === 0) return true;
    const raw = read(f.field);
    const have = raw === null || raw === undefined ? ["_"] : typeof raw === "string" ? [raw] : raw;
    const hit = have.some((v) => f.values.includes(v));
    return f.operator === "is" ? hit : !hit;
  });
}

/** What a view shows and how. */
export interface DisplayOptions {
  /** One of the layouts: `list`, `board`, or one the app adds. */
  layout: string;
  /** How records are grouped, e.g. `status`, or `none`. */
  grouping: string;
  /** How records are ordered, e.g. `priority`. */
  ordering: string;
  /** The switches on, by id: `{ subIssues: true, emptyGroups: false }`. */
  toggles: Readonly<Record<string, boolean>>;
  /** The properties shown on each record, by id: `["id", "status", "assignee"]`. */
  properties: ReadonlyArray<string>;
  /** Any other choice, by name: a timeline's `zoom`, the date a calendar places records on. */
  options?: Readonly<Record<string, string>>;
}
