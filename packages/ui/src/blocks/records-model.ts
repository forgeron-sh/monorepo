// The records model under the list views (issues, projects, invoices…): the fields of a record
// described once, and everything a view needs read off them. Pure: no React runtime here (a glyph is
// a `ReactNode` the caller puts in), so a server or a test can use it.
//
//   const fields = defineFields<Invoice>({
//     number: { label: "Number", kind: "text", get: (r) => r.number },
//     status: { label: "Status", kind: "status", get: (r) => r.status, options: INVOICE_STATUSES },
//     customer: { label: "Customer", kind: "person", get: (r) => r.customer },
//     due: { label: "Due", kind: "date", get: (r) => r.due },
//   });
//
// From that: the groups of a list or the columns of a board (`groups`), the orderings (`compare`),
// the filter fields (`filterFields`, in records-fields), `matchesFilters` and `useListView`
// (`viewSpec`), the display properties, the pickers of a property panel, the marks of a row.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import type { ViewGrouping, ViewSpec } from "../hooks/use-list-view";
import type { StatusTone } from "../status-model";
import type { LabelOption, Person } from "../pickers";

/** What a field holds. It picks the mark, the picker, the way to order and to group. */
export type RecordFieldKind =
  | "status"
  | "enum"
  | "person"
  | "people"
  | "labels"
  | "date"
  | "text"
  | "number"
  | "quarter";

/** The value a field reads from a record: a key, a list of keys (labels), a number, or nothing. */
export type RecordFieldValue = string | number | ReadonlyArray<string> | null | undefined;

/** One value a field can take, as a picker and a filter list it. */
export interface RecordFieldChoice {
  value: string;
  label: string;
  tone?: StatusTone;
  /** The mark before the label: a status glyph, an avatar, a swatch. */
  glyph?: ReactNode;
  hint?: string;
  /** A person's picture or a label's colour, for the marks the model does not draw itself. */
  src?: string;
  color?: string;
}

/** What `person`, `people` and `labels` fields choose from: given to the view, not to the fields. */
export interface RecordContext {
  people?: ReadonlyArray<Person>;
  labels?: ReadonlyArray<LabelOption>;
  /** `YYYY-MM-DD`: a date before it reads as late, the year is written when it differs. */
  today?: string;
}

/** Where a field sits in a row and in a card. */
export interface RecordFieldPlace {
  /** In a row: before the title (`lead`) or after it (`trail`, the default). */
  row?: "lead" | "trail";
  /**
   * In a card: `top` (the left of the first line), `who` (its right), `lead` (before the title),
   * `chips` (the default), `foot` (last line).
   */
  card?: "top" | "who" | "lead" | "chips" | "foot";
}

/** What a `defineStatuses` set gives: its `items`, a glyph being whatever was put in. */
export interface RecordChoiceSet {
  readonly items: ReadonlyArray<Omit<RecordFieldChoice, "glyph"> & { glyph?: unknown }>;
}

export interface RecordFieldDef<R> {
  /** The name: in pickers, filters, the display menu, the headers of groups. */
  label: string;
  kind: RecordFieldKind;
  /** The value of a record. A number is read as its text (`1` is `"1"`); null or `""` is unset. */
  get: (record: R) => RecordFieldValue;
  /**
   * The values to choose from: a `defineStatuses` set, a list, or a function of the view's
   * context. `person` and `labels` fields take the context's people and labels when absent.
   */
  options?:
    | RecordChoiceSet
    | ReadonlyArray<RecordFieldChoice>
    | ((context: RecordContext) => ReadonlyArray<RecordFieldChoice>);
  /**
   * The patch a new value makes. By default `{ [key]: value }`: a person goes back to `null`, a
   * date to `undefined`, a `number` field is converted.
   */
  set?: (value: string | string[] | null, record: R) => Partial<R>;
  /** The value that means "none" in `options` (a priority `"0"`): empty, and last when ordered. */
  none?: string;
  /** The entry for nobody in a person picker ("No assignee"); also what an unset person reads. */
  empty?: string;
  /** The mark of the field itself: in the filter menu, beside its name. */
  icon?: IconDefinition;
  /** Words for assistive technology that a mark only draws: `(label, value) => "Urgent priority"`. */
  words?: (label: string, value: string | null) => string;
  /** A date is late: `(record, today) => boolean`. Without it a date is never late. */
  late?: (record: R, today: string) => boolean;
  /** In a card, written before a date ("Due "). */
  prefix?: string;
  /** The years offered by a `quarter` field, `[2026, 2027]`. */
  years?: ReadonlyArray<number>;
  /** Written in mono (an identifier, a figure). */
  mono?: boolean;
  /** A smaller, framed mark for a person: who wrote it, never read as the assignee. */
  compact?: boolean;
  /** Read-only unless `editors[key]` is an object: who wrote a record rarely changes. */
  readOnly?: boolean;
  /** Off in the display properties until asked for. */
  hidden?: boolean;
  /** The key that opens its picker on the current row (`"s"`). */
  shortcut?: string;
  place?: RecordFieldPlace;
  /** Defaults: true for the kinds that can, false for the others. */
  sortable?: boolean;
  groupable?: boolean;
  filterable?: boolean;
}

export type RecordFieldDefs<R> = Readonly<Record<string, RecordFieldDef<R>>>;

const GROUPABLE: ReadonlySet<RecordFieldKind> = new Set([
  "status",
  "enum",
  "person",
  "quarter",
  "date",
]);
const FILTERABLE: ReadonlySet<RecordFieldKind> = new Set([
  "status",
  "enum",
  "person",
  "people",
  "labels",
  "quarter",
]);

/** The unset key: what `matchesFilters` reads for a record without a value, and the "No …" group. */
export const RECORD_NONE = "_";

export interface RecordFields<R> {
  readonly defs: RecordFieldDefs<R>;
  /** Every field, in the order described. */
  readonly keys: ReadonlyArray<string>;
  /** The definition; throws on a key that is not a field. */
  def: (key: string) => RecordFieldDef<R>;
  /** The keys of the fields that can be grouped, ordered, filtered. */
  readonly groupable: ReadonlyArray<string>;
  readonly sortable: ReadonlyArray<string>;
  readonly filterable: ReadonlyArray<string>;
  /** What a record holds for a field, as keys; null when unset. */
  values: (record: R, key: string) => string[] | null;
  /** The text of a record's value: for sorting, search and sentences. */
  text: (record: R, key: string, context?: RecordContext) => string;
  /** Whether the record has nothing set for the field. */
  isEmpty: (record: R, key: string) => boolean;
  /** The values to choose from, in order. */
  choices: (key: string, context?: RecordContext) => RecordFieldChoice[];
  choice: (key: string, value: string, context?: RecordContext) => RecordFieldChoice | undefined;
  /** Orders two records by a field: by the order of the choices, empty ones last. */
  compare: (key: string, context?: RecordContext) => (a: R, b: R) => number;
  /** How `useListView` groups by a field: a record's key, the order of the keys, their names. */
  grouping: (key: string, context?: RecordContext) => ViewGrouping<R>;
  /** `useListView`'s spec: filter on any filterable field, group and order by the others. */
  viewSpec: (context?: RecordContext) => ViewSpec<R>;
  /** The patch for a new value of a field: `{ [key]: value }` unless the field says otherwise. */
  patch: (key: string, value: string | string[] | null, record: R) => Partial<R>;
}

const asKeys = (value: RecordFieldValue): string[] | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return [String(value)];
  if (typeof value === "string") return [value];
  return value.length > 0 ? [...value] : null;
};

/** Describes the fields of a record once; see the file's header. */
export function defineFields<R>(defs: RecordFieldDefs<R>): RecordFields<R> {
  const keys = Object.keys(defs);
  const def = (key: string): RecordFieldDef<R> => {
    const found = defs[key];
    if (!found) throw new Error(`Unknown field "${key}"`);
    return found;
  };
  const where = (test: (d: RecordFieldDef<R>) => boolean) => keys.filter((k) => test(defs[k]!));
  const groupable = where((d) => d.groupable ?? GROUPABLE.has(d.kind));
  const filterable = where((d) => d.filterable ?? FILTERABLE.has(d.kind));
  const sortable = where((d) => d.sortable ?? (d.kind !== "labels" && d.kind !== "people"));

  const values: RecordFields<R>["values"] = (record, key) => asKeys(def(key).get(record));
  const isEmpty: RecordFields<R>["isEmpty"] = (record, key) => {
    const v = values(record, key);
    const none = def(key).none;
    return v === null || (none !== undefined && v.length === 1 && v[0] === none);
  };

  const choices: RecordFields<R>["choices"] = (key, context = {}) => {
    const d = def(key);
    const o = d.options;
    if (typeof o === "function") return [...o(context)];
    if (Array.isArray(o)) return [...(o as ReadonlyArray<RecordFieldChoice>)];
    if (o) return [...(o as RecordChoiceSet).items] as RecordFieldChoice[];
    if (d.kind === "person" || d.kind === "people") {
      return (context.people ?? []).map((p) => ({
        value: p.id,
        label: p.name,
        ...(p.hint ? { hint: p.hint } : {}),
        ...(p.src ? { src: p.src } : {}),
      }));
    }
    if (d.kind === "labels") {
      return (context.labels ?? []).map((l) => ({
        value: l.value,
        label: l.label,
        color: l.color,
      }));
    }
    return [];
  };
  const choice: RecordFields<R>["choice"] = (key, value, context) =>
    choices(key, context).find((c) => c.value === value);

  const rank = (key: string, context: RecordContext | undefined) => {
    const order = new Map(choices(key, context).map((c, i) => [c.value, i] as const));
    return (v: string) => order.get(v) ?? order.size;
  };

  const text: RecordFields<R>["text"] = (record, key, context) => {
    const v = values(record, key);
    if (v === null) return "";
    const d = def(key);
    const byValue = d.options !== undefined || d.kind === "person" || d.kind === "labels";
    return v.map((x) => (byValue ? (choice(key, x, context)?.label ?? x) : x)).join(", ");
  };

  const compare: RecordFields<R>["compare"] = (key, context) => {
    const d = def(key);
    const ranked = d.options !== undefined && d.kind !== "person";
    const position = ranked ? rank(key, context) : null;
    return (a, b) => {
      const ea = isEmpty(a, key);
      const eb = isEmpty(b, key);
      if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1;
      if (position) return position(values(a, key)![0]!) - position(values(b, key)![0]!);
      if (d.kind === "number") return Number(values(a, key)![0]) - Number(values(b, key)![0]);
      return text(a, key, context).localeCompare(text(b, key, context));
    };
  };

  const grouping: RecordFields<R>["grouping"] = (key, context) => {
    const d = def(key);
    const list = choices(key, context);
    const none = d.none;
    return {
      key: (r) => (isEmpty(r, key) ? (none ?? RECORD_NONE) : values(r, key)![0]!),
      order: [
        ...list.map((c) => c.value),
        ...(d.kind === "status" || list.some((c) => c.value === none) ? [] : [RECORD_NONE]),
      ],
      name: (k) => {
        const c = list.find((x) => x.value === k);
        if (c) return c.label;
        return k === RECORD_NONE ? (d.empty ?? `No ${d.label.toLowerCase()}`) : k;
      },
    };
  };

  const viewSpec: RecordFields<R>["viewSpec"] = (context) => ({
    read: (record, field) => values(record, field),
    groupings: Object.fromEntries(groupable.map((k) => [k, grouping(k, context)])),
    orderings: Object.fromEntries(sortable.map((k) => [k, compare(k, context)])),
  });

  const patch: RecordFields<R>["patch"] = (key, value, record) => {
    const d = def(key);
    if (d.set) return d.set(value, record);
    const next = Array.isArray(value)
      ? value
      : value === null
        ? d.kind === "person"
          ? null
          : undefined
        : d.kind === "number"
          ? Number(value)
          : value;
    return { [key]: next } as Partial<R>;
  };

  return {
    defs,
    keys,
    def,
    groupable,
    sortable,
    filterable,
    values,
    text,
    isEmpty,
    choices,
    choice,
    compare,
    grouping,
    viewSpec,
    patch,
  };
}
