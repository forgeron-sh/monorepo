// What the fields of a record draw: the marks of a row or a card, the picker of each kind, and the
// lists the view's menus need (filter fields, display properties, groups with their glyph). All of
// it is read off `defineFields` (records-model.ts); nothing here knows an issue or an invoice.

import {
  Attachment01Icon,
  BarChartIcon,
  BracesIcon,
  Calendar03Icon,
  CheckmarkSquare02Icon,
  HashtagIcon,
  Link01Icon,
  Loading03Icon,
  Tag01Icon,
  Tick02Icon,
  UserIcon,
  type IconDefinition,
} from "@forgeron/icons";
import type { ReactNode } from "react";
import { Avatar } from "../avatar";
import { cx } from "../cx";
import { formatShort, parseIso } from "../dates";
import type { DisplayChoice } from "./filtering-display-menu";
import type { FilterField } from "./filtering-model";
import { Icon } from "../icon";
import { Led } from "../led";
import { DatePicker, SelectMenu, type DatePreset, type SelectMenuOption } from "../overlays";
import { LabelPicker, PersonPicker, type LabelOption, type Person } from "../pickers";
import { viewRecords, type ViewGroup } from "../hooks/use-list-view";
import type {
  RecordFieldChoice,
  RecordFieldDef,
  RecordFieldKind,
  RecordContext,
  RecordFields,
} from "./records-model";
import { RECORD_NONE } from "./records-model";
import type { PropertyRow } from "./record-properties";
import { PropertyText } from "./record-properties";

/** A fully custom editor of a field: drawn in place of the picker, calls `change` with a patch. */
export type RecordEditorRender<R> = (record: R, change: (patch: Partial<R>) => void) => ReactNode;

/** How a field is edited: restricted or renamed choices, your own control. Absent: the picker. */
export interface RecordEditor<R> {
  /** Replaces the picker with your own control; the shortcut then does nothing. */
  render?: RecordEditorRender<R>;
  /** The values offered, in order (a status, an enum, a quarter). */
  values?: ReadonlyArray<string>;
  /** Other names for them, `{ review: "Waiting on client" }`. */
  names?: Readonly<Record<string, string>>;
  /** Who can be chosen (a person); the view's `people` by default. */
  people?: ReadonlyArray<Person>;
  /** The person viewing: listed first, marked "(you)". */
  me?: string;
  /** The entry for nobody; the field's `empty` by default, `null` to require someone. */
  noneLabel?: string | null;
  /** The labels offered; the view's `labels` by default. */
  labels?: ReadonlyArray<LabelOption>;
  /** The quick picks above the month of a date. */
  presets?: ReadonlyArray<DatePreset>;
  /** Offers to remove the date; true by default. */
  clearable?: boolean;
}

/** Per field: `false` for read-only, options to restrict the choices, `render` for your own. */
export type RecordEditors<R> = Readonly<Record<string, false | RecordEditor<R> | undefined>>;

/** The options of a field's editor, or null when it is read-only. */
export function recordEditor<R>(
  fields: RecordFields<R>,
  editors: RecordEditors<R> | undefined,
  name: string,
): RecordEditor<R> | null {
  const given = editors?.[name];
  if (given === false) return null;
  if (given === undefined) return fields.def(name).readOnly ? null : {};
  return given;
}

/* ---------------------------------------------------------------- marks of the choices */

const KIND_ICON: Readonly<Record<RecordFieldKind, IconDefinition>> = {
  status: Loading03Icon,
  enum: BarChartIcon,
  person: UserIcon,
  people: UserIcon,
  labels: Tag01Icon,
  date: Calendar03Icon,
  quarter: Calendar03Icon,
  text: HashtagIcon,
  number: HashtagIcon,
  boolean: CheckmarkSquare02Icon,
  relation: Link01Icon,
  file: Attachment01Icon,
  json: BracesIcon,
};

/** The glyph of a choice: its own, else a person's avatar, a label's swatch, a tone's LED. */
function glyphOf(def: RecordFieldDef<never>, c: RecordFieldChoice, size = 16): ReactNode {
  if (c.glyph !== undefined) return c.glyph;
  if (def.kind === "person" || def.kind === "people")
    return <Avatar name={c.label} size={size} {...(c.src ? { src: c.src } : {})} />;
  if (def.kind === "labels")
    return <span className="fg-swatch-mark" style={{ background: c.color ?? "var(--ink-dim)" }} />;
  if (c.tone) return <Led tone={c.tone === "strong" ? "current" : c.tone} />;
  return null;
}

/** The choices of a field as the options of a `SelectMenu`, marks drawn. */
export function fieldOptions<R>(
  fields: RecordFields<R>,
  name: string,
  context?: RecordContext,
): SelectMenuOption[] {
  const def = fields.def(name);
  return fields.choices(name, context).map((c) => {
    const glyph = glyphOf(def as RecordFieldDef<never>, c);
    return {
      value: c.value,
      label: c.label,
      ...(glyph ? { glyph } : {}),
      ...(c.hint ? { hint: c.hint } : {}),
    };
  });
}

/* ---------------------------------------------------------------- the menus' lists */

/**
 * The filter fields of `FilterBar` and `FilterMenu`: every filterable field with its choices, a
 * "No …" entry for the people. `records` puts how many have each value at the end of the row.
 */
export function filterFields<R>(
  fields: RecordFields<R>,
  context?: RecordContext,
  records?: ReadonlyArray<R>,
): FilterField[] {
  return fields.filterable.map((name) => {
    const def = fields.def(name);
    const options = fieldOptions(fields, name, context);
    if (def.empty && def.kind === "person")
      options.push({
        value: RECORD_NONE,
        label: def.empty,
        glyph: <span className="fg-av-none" />,
      });
    const counts = new Map<string, number>();
    for (const r of records ?? [])
      for (const v of fields.values(r, name) ?? [RECORD_NONE])
        counts.set(v, (counts.get(v) ?? 0) + 1);
    return {
      id: name,
      label: def.label,
      icon: def.icon ?? KIND_ICON[def.kind],
      options: options.map((o) => ({
        value: o.value,
        label: o.label,
        ...(o.glyph ? { glyph: o.glyph } : {}),
        ...(records ? { hint: String(counts.get(o.value) ?? 0) } : {}),
      })),
    };
  });
}

/** The properties of the Display menu: every field but the title and the id, in order. */
export function displayProperties<R>(
  fields: RecordFields<R>,
  skip: ReadonlyArray<string> = [],
): DisplayChoice[] {
  return fields.keys
    .filter((k) => !skip.includes(k))
    .map((k) => ({ id: k, label: fields.def(k).label }));
}

/** The properties shown at first: every field not marked `hidden`. */
export function defaultProperties<R>(fields: RecordFields<R>): string[] {
  return fields.keys.filter((k) => !fields.def(k).hidden);
}

/** The groupings of the Display menu: "No grouping", then the groupable fields. */
export function groupingOptions<R>(fields: RecordFields<R>): SelectMenuOption[] {
  return [
    { value: "none", label: "No grouping" },
    ...fields.groupable.map((k) => ({ value: k, label: fields.def(k).label })),
  ];
}

/** The orderings of the Display menu: the sortable fields. */
export function orderingOptions<R>(fields: RecordFields<R>): SelectMenuOption[] {
  return fields.sortable.map((k) => ({ value: k, label: fields.def(k).label }));
}

/** A group of a list or a column of a board. */
export interface RecordGroup<R> {
  key: string;
  name: string;
  /** The mark before the name: a status glyph, an avatar, a swatch. */
  glyph?: ReactNode;
  records: ReadonlyArray<R>;
}

/**
 * The groups of `records` by a field (`none`: one group), each with the glyph of its value. Empty
 * groups are kept with `keepEmpty`, for a board whose columns are the field's values.
 */
export function recordGroups<R>(
  fields: RecordFields<R>,
  records: ReadonlyArray<R>,
  by: string,
  context?: RecordContext,
  { keepEmpty = false }: { keepEmpty?: boolean } = {},
): RecordGroup<R>[] {
  const spec = fields.viewSpec(context);
  const { groups } = viewRecords(records, spec, [], { grouping: by, ordering: "" }, { keepEmpty });
  return withGlyphs(fields, groups, by, context);
}

/** Gives the groups of `useListView` the glyph of their value. */
export function withGlyphs<R>(
  fields: RecordFields<R>,
  groups: ReadonlyArray<ViewGroup<R>>,
  by: string,
  context?: RecordContext,
): RecordGroup<R>[] {
  if (!fields.groupable.includes(by)) return groups.map((g) => ({ ...g }));
  const def = fields.def(by) as RecordFieldDef<never>;
  return groups.map((g) => {
    const c = fields.choice(by, g.key, context);
    const glyph = c ? glyphOf(def, c) : null;
    return { ...g, ...(glyph ? { glyph } : {}) };
  });
}

/* ---------------------------------------------------------------- marks of a record's values */

/** `cell` is the cell of a grid: one line, chips of the choices, no place of its own. */
type View = "row" | "card" | "cell";

export interface RecordFieldMarkProps<R> {
  fields: RecordFields<R>;
  name: string;
  record: R;
  context: RecordContext;
  view: View;
}

const closedWord = ", overdue";

/** What a field of a record reads as in a row or a card: a mark, a face, chips, a date, text. */
export function RecordFieldMark<R>({
  fields,
  name,
  record,
  context,
  view,
}: RecordFieldMarkProps<R>) {
  const def = fields.def(name);
  const value = fields.values(record, name)?.[0] ?? null;
  const row = view === "row";
  const slot = def.place?.card ?? "chips";
  if (view === "cell")
    return <RecordCellMark fields={fields} name={name} record={record} context={context} />;
  switch (def.kind) {
    case "status":
    case "enum":
    case "quarter": {
      const c = value === null ? undefined : fields.choice(name, value, context);
      const label = c?.label ?? value ?? def.empty ?? `No ${def.label.toLowerCase()}`;
      const words = def.words?.(label, value) ?? label;
      const mark = c ? glyphOf(def as RecordFieldDef<never>, c) : null;
      const cls = row
        ? "fg-ilist-mark"
        : slot === "chips"
          ? "fg-issue-chip fg-iboard-prio"
          : "fg-iboard-status";
      return (
        <span className={cls} title={words}>
          {mark ?? <span>{label}</span>}
          {mark ? <span className="fg-sr">{words}</span> : null}
        </span>
      );
    }
    case "person":
    case "people": {
      const ids = fields.values(record, name) ?? [];
      const known = ids.flatMap((id) => {
        const c = fields.choice(name, id, context);
        return c ? [c] : [];
      });
      const size = def.compact ? 14 : 18;
      const names = known.map((c) => c.label).join(", ");
      const words = def.words
        ? def.words(names, value)
        : names || (def.empty ?? `No ${def.label.toLowerCase()}`);
      return (
        <span className={cx("fg-issue-who", def.compact && "fg-issue-author")} title={words}>
          {known.length === 0 ? (
            <span className="fg-issue-nobody" aria-hidden="true" />
          ) : (
            known.map((c) => (
              <Avatar key={c.value} name={c.label} size={size} {...(c.src ? { src: c.src } : {})} />
            ))
          )}
          <span className="fg-sr">{words}</span>
        </span>
      );
    }
    case "labels":
      return (
        <>
          {(fields.values(record, name) ?? []).map((v) => {
            const c = fields.choice(name, v, context);
            return (
              <span key={v} className="fg-issue-chip">
                <span
                  className="fg-swatch-mark"
                  style={{ background: c?.color ?? "var(--ink-dim)" }}
                  aria-hidden="true"
                />
                {c?.label ?? v}
              </span>
            );
          })}
        </>
      );
    case "date": {
      const cls = row ? "fg-ilist-due" : "fg-iboard-due";
      if (value === null) return <span className={cls} />;
      const late = context.today !== undefined && (def.late?.(record, context.today) ?? false);
      const year = context.today === undefined ? undefined : parseIso(context.today).getFullYear();
      return (
        <span className={cx(cls, late && "fg-issue-overdue")}>
          {row ? null : def.prefix}
          {formatShort(value, year)}
          {late ? <span className="fg-sr">{closedWord}</span> : null}
        </span>
      );
    }
    case "boolean":
      return <BooleanMark value={fields.values(record, name)?.[0] ?? null} />;
    case "relation":
    case "file":
      return <ChipsMark fields={fields} name={name} record={record} context={context} />;
    case "json":
      return <span className={row ? "fg-ilist-id" : "fg-iboard-id"}>{value ?? ""}</span>;
    case "text":
    case "number": {
      const cls = def.mono
        ? row
          ? "fg-ilist-id"
          : "fg-iboard-id"
        : row
          ? "fg-ilist-text"
          : "fg-iboard-text";
      return <span className={cls}>{value ?? ""}</span>;
    }
  }
}

/** A yes or no as a box: ticked for yes, empty for no and for unset. */
function BooleanMark({ value }: { value: string | null }) {
  const on = value === "true";
  return (
    <span className={cx("fg-check-box fg-rec-bool", on && "fg-rec-bool-on")}>
      {on ? <Icon icon={Tick02Icon} size={12} variant="mono" /> : null}
      <span className="fg-sr">{on ? "Yes" : "No"}</span>
    </span>
  );
}

/** The records of a relation (named by the choices) or the files of a field, as chips. */
function ChipsMark<R>({
  fields,
  name,
  record,
  context,
}: {
  fields: RecordFields<R>;
  name: string;
  record: R;
  context: RecordContext;
}) {
  const file = fields.def(name).kind === "file";
  return (
    <span className="fg-rec-chips">
      {(fields.values(record, name) ?? []).map((v) => (
        <span key={v} className={file ? "fg-rec-chip fg-rec-file" : "fg-rec-chip fg-rec-rel"}>
          {file ? <Icon icon={Attachment01Icon} size={12} variant="mono" /> : null}
          {file ? v : (fields.choice(name, v, context)?.label ?? v)}
        </span>
      ))}
    </span>
  );
}

/** What a grid cell holds: the box, chips of the choices, or the value as one line of text. */
function RecordCellMark<R>({
  fields,
  name,
  record,
  context,
}: {
  fields: RecordFields<R>;
  name: string;
  record: R;
  context: RecordContext;
}) {
  const def = fields.def(name);
  switch (def.kind) {
    case "boolean":
      return <BooleanMark value={fields.values(record, name)?.[0] ?? null} />;
    case "relation":
    case "file":
      return <ChipsMark fields={fields} name={name} record={record} context={context} />;
    case "status":
    case "enum":
    case "quarter":
    case "labels":
      return (
        <span className="fg-rec-chips">
          {(fields.values(record, name) ?? []).map((v) => {
            const c = fields.choice(name, v, context);
            return (
              <span key={v} className="fg-rec-chip">
                <span
                  className="fg-swatch-mark"
                  style={{ background: c?.color ?? "var(--ink-dim)" }}
                />
                {c?.label ?? v}
              </span>
            );
          })}
        </span>
      );
    default:
      return <span className="fg-rec-text">{fields.text(record, name, context)}</span>;
  }
}

/* ---------------------------------------------------------------- the picker of a kind */

/** Whether a kind has a picker of its own; text and numbers are edited with `render`. */
export const hasPicker = (kind: RecordFieldKind): boolean =>
  kind === "status" ||
  kind === "enum" ||
  kind === "quarter" ||
  kind === "person" ||
  kind === "labels" ||
  kind === "date";

export interface RecordFieldPickerProps<R> {
  fields: RecordFields<R>;
  name: string;
  /** The record, or the draft of one being made (`Partial<R>` as `R`: the getters tolerate it). */
  record: R;
  /** Hears the patch a new value makes. */
  onChange: (patch: Partial<R>) => void;
  context?: RecordContext;
  editor?: RecordEditor<R>;
  /** `chip` (default) on a record; `field` in a form. */
  variant?: "chip" | "field";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawn in the trigger in place of the value: a row's own mark. */
  children?: ReactNode;
  className?: string;
}

/**
 * The picker that goes with the kind of a field: a list of choices for a status, an enum or a
 * quarter, people, labels, a date. Null for a kind with none (text, numbers).
 */
export function RecordFieldPicker<R>({
  fields,
  name,
  record,
  onChange,
  context = {},
  editor = {},
  variant = "chip",
  open,
  onOpenChange,
  children,
  className,
}: RecordFieldPickerProps<R>) {
  const def = fields.def(name);
  const value = fields.values(record, name);
  const openProps = {
    ...(open !== undefined ? { open } : {}),
    ...(onOpenChange ? { onOpenChange } : {}),
  };
  const common = {
    variant,
    ...openProps,
    ...(className ? { className } : {}),
    ...(children !== undefined ? { children } : {}),
  };
  const change = (next: string | string[] | null) => onChange(fields.patch(name, next, record));
  switch (def.kind) {
    case "status":
    case "enum":
    case "quarter": {
      const all = fieldOptions(fields, name, context);
      const offered = editor.values
        ? editor.values.flatMap((v) => all.filter((o) => o.value === v))
        : all;
      const options = offered.map((o) =>
        editor.names?.[o.value] ? { ...o, label: editor.names[o.value]! } : o,
      );
      return (
        <SelectMenu
          label={def.label}
          numbered={def.kind === "status"}
          options={def.empty ? [{ value: RECORD_NONE, label: def.empty }, ...options] : options}
          value={value?.[0] ?? def.none ?? (def.empty ? RECORD_NONE : null)}
          onChange={(v) => change(v === RECORD_NONE ? null : v)}
          {...(def.empty ? { placeholder: def.label } : {})}
          {...common}
        />
      );
    }
    case "person": {
      const none = editor.noneLabel === undefined ? def.empty : (editor.noneLabel ?? undefined);
      const people = editor.people ?? context.people ?? [];
      return (
        <PersonPicker
          label={def.label}
          people={people}
          value={value?.[0] ?? null}
          onChange={(v) => change(v)}
          {...(editor.me ? { me: editor.me } : {})}
          {...(none ? { noneLabel: none } : {})}
          {...common}
        />
      );
    }
    case "labels":
      return (
        <LabelPicker
          labels={editor.labels ?? context.labels ?? []}
          value={value ?? []}
          onChange={(v) => change(v)}
          {...common}
        />
      );
    case "date":
      return (
        <DatePicker
          label={def.label}
          value={value?.[0] ?? null}
          onChange={(v) => change(v)}
          {...(editor.presets ? { presets: editor.presets } : {})}
          {...(editor.clearable !== undefined ? { clearable: editor.clearable } : {})}
          {...(context.today ? { today: context.today } : {})}
          {...common}
        />
      );
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- property panel and chips */

export interface RecordPropertiesProps<R> {
  fields: RecordFields<R>;
  record: R;
  /** Hears the patch of a changed property. Absent, the values are read, not picked. */
  onChange?: (patch: Partial<R>) => void;
  context?: RecordContext;
  editors?: RecordEditors<R>;
  /** The fields shown, in order; every one with a picker by default. */
  keys?: ReadonlyArray<string>;
}

/**
 * The rows of a `PropertyPanel`: a label and a picker per field (a `PropertyText` when it is
 * read-only or has no picker).
 */
export function propertyRows<R>({
  fields,
  record,
  onChange,
  context = {},
  editors,
  keys,
}: RecordPropertiesProps<R>): PropertyRow[] {
  const shown = keys ?? fields.keys.filter((k) => hasPicker(fields.def(k).kind));
  return shown.map((name) => {
    const def = fields.def(name);
    const editor = onChange ? recordEditor(fields, editors, name) : null;
    const control =
      editor?.render && onChange ? (
        editor.render(record, onChange)
      ) : editor && hasPicker(def.kind) && onChange ? (
        <RecordFieldPicker
          fields={fields}
          name={name}
          record={record}
          onChange={onChange}
          context={context}
          editor={editor}
        />
      ) : (
        <PropertyText dim={fields.isEmpty(record, name)}>
          {fields.text(record, name, context) || def.empty || "—"}
        </PropertyText>
      );
    return { id: name, label: def.label, control };
  });
}

/**
 * The pickers of some fields side by side, each in its chip variant: the children of a
 * `PropertyChips`, or the `properties` of a `CreateDialog`.
 */
export function RecordPickers<R>({
  fields,
  record,
  onChange,
  context,
  editors,
  keys,
}: RecordPropertiesProps<R> & { onChange: (patch: Partial<R>) => void }) {
  const shown = keys ?? fields.keys.filter((k) => hasPicker(fields.def(k).kind));
  return (
    <>
      {shown.map((name) => {
        const editor = recordEditor(fields, editors, name);
        return editor ? (
          <RecordFieldPicker
            key={name}
            fields={fields}
            name={name}
            record={record}
            onChange={onChange}
            {...(context ? { context } : {})}
            editor={editor}
          />
        ) : null;
      })}
    </>
  );
}
