// The model the Data hub blocks share: a field (a column with a type), a record (a row of values
// keyed by field id), the field types with their pixel glyphs, and the pure functions that read,
// check and write values. No React here: the blocks and the caller's server use the same rules.

import type { IconDefinition } from "@forgeron/icons";
import {
  Attachment01Icon,
  BracesIcon,
  Calendar03Icon,
  CalendarClockIcon,
  CheckmarkSquare02Icon,
  CircleArrowDown01Icon,
  GlobeIcon,
  HashtagIcon,
  Link01Icon,
  ListChecksIcon,
  MailAtSign02Icon,
  TextAlignLeftIcon,
  TextIcon,
} from "@forgeron/icons";

export type FieldType =
  | "text"
  | "longText"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "multiSelect"
  | "relation"
  | "file"
  | "email"
  | "url"
  | "json";

export interface FieldTypeInfo {
  type: FieldType;
  label: string;
  icon: IconDefinition;
  /** How the value is stored in SQLite (D1), shown in mono next to the label. */
  storage: "TEXT" | "INTEGER" | "REAL";
  /** One line: what the type holds. */
  description: string;
}

/** Every field type, in the order of the picker. */
export const FIELD_TYPES: ReadonlyArray<FieldTypeInfo> = [
  { type: "text", label: "Text", icon: TextIcon, storage: "TEXT", description: "One line" },
  {
    type: "longText",
    label: "Long text",
    icon: TextAlignLeftIcon,
    storage: "TEXT",
    description: "Several lines",
  },
  { type: "number", label: "Number", icon: HashtagIcon, storage: "REAL", description: "A figure" },
  {
    type: "boolean",
    label: "Checkbox",
    icon: CheckmarkSquare02Icon,
    storage: "INTEGER",
    description: "Yes or no",
  },
  { type: "date", label: "Date", icon: Calendar03Icon, storage: "TEXT", description: "A day" },
  {
    type: "datetime",
    label: "Date and time",
    icon: CalendarClockIcon,
    storage: "TEXT",
    description: "A moment, in UTC",
  },
  {
    type: "select",
    label: "Select",
    icon: CircleArrowDown01Icon,
    storage: "TEXT",
    description: "One choice of a list",
  },
  {
    type: "multiSelect",
    label: "Multi-select",
    icon: ListChecksIcon,
    storage: "TEXT",
    description: "Several choices",
  },
  {
    type: "relation",
    label: "Relation",
    icon: Link01Icon,
    storage: "TEXT",
    description: "Records of another table",
  },
  {
    type: "file",
    label: "File",
    icon: Attachment01Icon,
    storage: "TEXT",
    description: "Attachments",
  },
  {
    type: "email",
    label: "Email",
    icon: MailAtSign02Icon,
    storage: "TEXT",
    description: "An address",
  },
  { type: "url", label: "URL", icon: GlobeIcon, storage: "TEXT", description: "A link" },
  { type: "json", label: "JSON", icon: BracesIcon, storage: "TEXT", description: "Raw data" },
];

const TYPE_INFO = new Map(FIELD_TYPES.map((t) => [t.type, t] as const));

/** The label, glyph and storage of a type. */
export const fieldTypeInfo = (type: FieldType): FieldTypeInfo => TYPE_INFO.get(type)!;

/** One choice of a select or multi-select field. */
export interface FieldChoice {
  value: string;
  label: string;
  /** Any CSS colour: the square before the name. */
  color?: string;
}

/** A field of a table: a column, its type and its rules. */
export interface DataField {
  /** Stable key of the values; survives a rename. */
  id: string;
  /** The column name, in mono: `company_id`. */
  name: string;
  type: FieldType;
  /** The primary key: read-only once the record exists, first in the lists. */
  primary?: boolean;
  /** Not null. */
  required?: boolean;
  unique?: boolean;
  /** Computed or owned by someone else: shown, never edited. */
  readOnly?: boolean;
  /** Given to a new record. */
  defaultValue?: CellValue;
  /** One line under the field in a form. */
  description?: string;
  /** The choices of a select or multi-select. */
  choices?: ReadonlyArray<FieldChoice>;
  /** The table a relation points at, and whether it holds several records. */
  relation?: { table: string; multiple?: boolean };
  /** Digits after the point of a number; any when absent. */
  decimals?: number;
}

/**
 * A value of a cell. Multi-select, relation and file hold a list of strings (choice values, record
 * ids, file names); a number being typed may be a string until it is valid.
 */
export type CellValue = string | number | boolean | null | ReadonlyArray<string>;

/** The values of one record, by field id. */
export type RecordValues = Readonly<Record<string, CellValue>>;

/** A row of a table. */
export interface DataRecord {
  id: string;
  values: RecordValues;
}

/** A record another table can point at. */
export interface RelationTarget {
  id: string;
  /** What people read: the name of the company, the title of the issue. */
  label: string;
  /** Mono text at the end of the row: a code, a city. */
  hint?: string;
}

/** The records a relation can point at, by table name. */
export type RelationSources = Readonly<Record<string, ReadonlyArray<RelationTarget>>>;

/* ---------------------------------------------------------------- reading values */

/** A list value as an array; a single value as a one-item array; nothing as empty. */
export const listOf = (value: CellValue): string[] => {
  if (value === null || value === "") return [];
  if (Array.isArray(value)) return [...(value as ReadonlyArray<string>)];
  return [String(value)];
};

export const isEmptyValue = (value: CellValue) =>
  value === null || value === "" || (Array.isArray(value) && value.length === 0);

/** The value as one line of text, for a cell, a copy, a search. */
export function formatValue(
  field: DataField,
  value: CellValue,
  relations?: RelationSources,
): string {
  if (value === null || value === undefined) return "";
  switch (field.type) {
    case "boolean":
      return value === true ? "Yes" : value === false ? "No" : String(value);
    case "number":
      return typeof value === "number" && field.decimals !== undefined
        ? value.toFixed(field.decimals)
        : String(value);
    case "select":
    case "multiSelect": {
      const byValue = new Map(field.choices?.map((c) => [c.value, c.label]));
      return listOf(value)
        .map((v) => byValue.get(v) ?? v)
        .join(", ");
    }
    case "relation": {
      const targets = relations?.[field.relation?.table ?? ""];
      const byId = new Map(targets?.map((t) => [t.id, t.label]));
      return listOf(value)
        .map((v) => byId.get(v) ?? v)
        .join(", ");
    }
    case "file":
      return listOf(value).join(", ");
    default:
      return Array.isArray(value) ? value.join(", ") : String(value);
  }
}

/** The value as the text an editor starts from (the raw value, not the label). */
export function editText(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

const lower = (s: string) => s.toLowerCase();

/* ---------------------------------------------------------------- checking values */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;

const realDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const day = new Date(Date.UTC(y!, m! - 1, d!));
  return day.getUTCFullYear() === y && day.getUTCMonth() === m! - 1 && day.getUTCDate() === d;
};

/** What is wrong with a value of the field, in a few words; null when it is fine. */
export function validateValue(field: DataField, value: CellValue): string | null {
  if (isEmptyValue(value)) return field.required ? "Required" : null;
  switch (field.type) {
    case "number": {
      const n = typeof value === "number" ? value : Number(String(value).trim().replace(",", "."));
      if (typeof value === "boolean" || !Number.isFinite(n)) return "Expected a number";
      if (field.decimals === 0 && !Number.isInteger(n)) return "Expected a whole number";
      return null;
    }
    case "boolean":
      return typeof value === "boolean" ? null : "Expected yes or no";
    case "date":
      return typeof value === "string" && DATE.test(value) && realDate(value)
        ? null
        : "Expected a date, YYYY-MM-DD";
    case "datetime":
      return typeof value === "string" && DATETIME.test(value) && realDate(value)
        ? null
        : "Expected YYYY-MM-DD HH:MM";
    case "email":
      return typeof value === "string" && EMAIL.test(value) ? null : "Expected an email address";
    case "url": {
      if (typeof value !== "string") return "Expected a link";
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
          ? null
          : "Expected an http or https link";
      } catch {
        return "Expected a link, https://…";
      }
    }
    case "json":
      try {
        JSON.parse(String(value));
        return null;
      } catch {
        return "Not valid JSON";
      }
    case "select":
    case "multiSelect": {
      const known = new Set(field.choices?.map((c) => c.value));
      const values = listOf(value);
      if (field.type === "select" && values.length > 1) return "One choice only";
      const unknown = values.find((v) => !known.has(v));
      return unknown === undefined ? null : `Not a choice: ${unknown}`;
    }
    case "relation":
      return !field.relation?.multiple && listOf(value).length > 1 ? "One record only" : null;
    default:
      return null;
  }
}

/** The problems of a record, by field id; empty when it can be saved. */
export function validateRecord(
  fields: ReadonlyArray<DataField>,
  values: RecordValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.readOnly) continue;
    const problem = validateValue(field, values[field.id] ?? null);
    if (problem) errors[field.id] = problem;
  }
  return errors;
}

/**
 * Text typed or imported, as a value of the field: `"12,5"` → 12.5, `"yes"` → true, `"a; b"` → two
 * choices, labels → choice values. `{ error }` when the text cannot be one.
 */
export function parseValue(
  field: DataField,
  text: string,
  relations?: RelationSources,
): { value: CellValue } | { error: string } {
  const raw = text.trim();
  if (raw === "") return field.required ? { error: "Required" } : { value: null };
  let value: CellValue = raw;
  switch (field.type) {
    case "number": {
      const n = Number(raw.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(n)) return { error: "Expected a number" };
      value = n;
      break;
    }
    case "boolean": {
      const t = raw.toLowerCase();
      if (["true", "yes", "y", "1", "x", "oui", "✓"].includes(t)) value = true;
      else if (["false", "no", "n", "0", "non", ""].includes(t)) value = false;
      else return { error: "Expected yes or no" };
      break;
    }
    case "datetime":
      value = raw.replace("T", " ").slice(0, 16);
      break;
    case "longText":
    case "json":
      value = text;
      break;
    case "select":
    case "multiSelect": {
      const parts = field.type === "select" ? [raw] : raw.split(/[;,]/).map((p) => p.trim());
      const values: string[] = [];
      for (const part of parts.filter(Boolean)) {
        const choice = field.choices?.find(
          (c) => c.value === part || lower(c.label) === lower(part),
        );
        if (!choice) return { error: `Not a choice: ${part}` };
        values.push(choice.value);
      }
      value = field.type === "select" ? (values[0] ?? null) : values;
      break;
    }
    case "relation": {
      const targets = relations?.[field.relation?.table ?? ""];
      const ids: string[] = [];
      for (const part of raw
        .split(/[;,]/)
        .map((p) => p.trim())
        .filter(Boolean)) {
        const target = targets?.find((t) => t.id === part || lower(t.label) === lower(part));
        if (targets && !target) return { error: `No ${field.relation?.table} ${part}` };
        ids.push(target?.id ?? part);
      }
      value = ids;
      break;
    }
    case "file":
      value = raw
        .split(/[;,]/)
        .map((p) => p.trim())
        .filter(Boolean);
      break;
    default:
      break;
  }
  const problem = validateValue(field, value);
  return problem ? { error: problem } : { value };
}

/** The values as the fields store them: a number typed as text becomes a number. */
export function normalizeValues(
  fields: ReadonlyArray<DataField>,
  values: RecordValues,
): Record<string, CellValue> {
  const out: Record<string, CellValue> = { ...values };
  for (const field of fields) {
    const v = out[field.id];
    if (field.type === "number" && typeof v === "string" && v.trim() !== "") {
      const n = Number(v.trim().replace(",", "."));
      if (Number.isFinite(n)) out[field.id] = n;
    }
  }
  return out;
}

/** The values of a new record: each field's default, or nothing. */
export function initialValues(fields: ReadonlyArray<DataField>): Record<string, CellValue> {
  return Object.fromEntries(fields.map((f) => [f.id, f.defaultValue ?? null]));
}

/* ---------------------------------------------------------------- field names */

/** Lower case letters, digits and underscores, not starting with a digit: a safe column name. */
export const FIELD_NAME = /^[a-z_][a-z0-9_]*$/;

/** What is wrong with a field name, or null: empty, not a column name, taken. */
export function fieldNameError(
  name: string,
  taken: ReadonlyArray<string> = [],
  pattern: RegExp | null = FIELD_NAME,
): string | null {
  const n = name.trim();
  if (!n) return "A field needs a name";
  if (pattern && !pattern.test(n)) return "Lower case letters, digits and _ only";
  if (taken.some((t) => t.toLowerCase() === n.toLowerCase())) return `${n} exists already`;
  return null;
}

/** A column name from any heading: `"Due date"` → `due_date`. */
export const toFieldName = (heading: string) =>
  heading
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "_$1");

/* ---------------------------------------------------------------- CSV */

/** The delimiter a text most likely uses: comma, semicolon or tab, read from its first line. */
export function guessDelimiter(text: string): "," | ";" | "\t" {
  const line = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (c: string) => line.split(c).length - 1;
  const tabs = count("\t");
  const semis = count(";");
  const commas = count(",");
  if (tabs > 0 && tabs >= semis && tabs >= commas) return "\t";
  return semis > commas ? ";" : ",";
}

/**
 * Rows of a CSV (RFC 4180): quoted values may hold the delimiter, quotes doubled and line breaks.
 * Empty lines are dropped.
 */
export function parseCsv(text: string, delimiter: string = guessDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

/**
 * For each source column, the field it most likely fills: same name, same column name, or same
 * words; each field taken once. null: skipped.
 */
export function guessMapping(
  columns: ReadonlyArray<string>,
  fields: ReadonlyArray<DataField>,
): (string | null)[] {
  const used = new Set<string>();
  const squash = (s: string) => toFieldName(s).replace(/_/g, "");
  return columns.map((column) => {
    const key = squash(column);
    const field = fields.find(
      (f) => !used.has(f.id) && !f.readOnly && (squash(f.name) === key || squash(f.id) === key),
    );
    if (!field) return null;
    used.add(field.id);
    return field.id;
  });
}
