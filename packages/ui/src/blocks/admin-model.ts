// The model of the administration blocks and its pure helpers: permissions as a grid of
// allow, deny or inherit, invitations, exports and the trash. Nothing here knows an app: a console, a people directory or any app
// with settings reads the same. There is no concept of role: a subject (a person, a team) holds a
// state on each permission, and what it does not hold it inherits.

/* ---------------------------------------------------------------- shared */

export { adminDay, adminDaysBetween, formatAdminDate, relativeDay } from "../dates";
import { adminDay, adminDaysBetween } from "../dates";

/** `1 item`, `2 items`. */
export function adminPlural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

/** The list without the value, or with it when absent. */
export function toggleIn(list: ReadonlyArray<string>, value: string, on?: boolean): string[] {
  const has = list.includes(value);
  const want = on ?? !has;
  if (want === has) return [...list];
  return want ? [...list, value] : list.filter((x) => x !== value);
}

/* ---------------------------------------------------------------- permissions */

/** What a subject holds on a permission: yes, no, or whatever it inherits. */
export type PermissionState = "allow" | "deny" | "inherit";

export const PERMISSION_STATES: ReadonlyArray<PermissionState> = ["inherit", "allow", "deny"];

export const PERMISSION_NAMES: Readonly<Record<PermissionState, string>> = {
  allow: "Allowed",
  deny: "Denied",
  inherit: "Inherited",
};

/** A row of the grid: a person or a team. */
export interface PermissionSubject {
  id: string;
  name: string;
  kind?: "person" | "team";
  /** Mono text under the name: an email, a member count. */
  hint?: string;
}

/** A column of the grid: one action on one resource. */
export interface PermissionColumn {
  id: string;
  /** The action: "Read", "Write", "Delete". */
  label: string;
  /** The resource it applies to: "Invoices". Written above the label, and in the summary. */
  group?: string;
}

/** The states that are not inherited, by `subjectId` and `columnId` (see `permissionKey`). */
export type PermissionValue = Readonly<Record<string, PermissionState>>;

/** The key of one cell in a `PermissionValue`. */
export const permissionKey = (subjectId: string, columnId: string) =>
  `${subjectId}\u0000${columnId}`;

/** The state of one cell; absent means inherit. */
export function permissionAt(
  value: PermissionValue,
  subjectId: string,
  columnId: string,
): PermissionState {
  return value[permissionKey(subjectId, columnId)] ?? "inherit";
}

/** The click on a cell: inherit, then allow, then deny, then inherit again. */
export function nextPermissionState(state: PermissionState): PermissionState {
  return state === "inherit" ? "allow" : state === "allow" ? "deny" : "inherit";
}

/** A copy of the value with one cell set; `inherit` removes the key so equal grids are equal. */
export function setPermission(
  value: PermissionValue,
  subjectId: string,
  columnId: string,
  state: PermissionState,
): PermissionValue {
  const key = permissionKey(subjectId, columnId);
  if ((value[key] ?? "inherit") === state) return value;
  const { [key]: _gone, ...rest } = value;
  return state === "inherit" ? rest : { ...rest, [key]: state };
}

/** The state shared by a group of cells, or `mixed` when they differ. */
export function sharedState(
  value: PermissionValue,
  cells: ReadonlyArray<readonly [subjectId: string, columnId: string]>,
): PermissionState | "mixed" {
  let found: PermissionState | undefined;
  for (const [s, c] of cells) {
    const state = permissionAt(value, s, c);
    if (found === undefined) found = state;
    else if (found !== state) return "mixed";
  }
  return found ?? "inherit";
}

/** What a click on a row or column header sets: mixed or inherited become allow, allow becomes deny. */
export function bulkTarget(shared: PermissionState | "mixed"): PermissionState {
  return shared === "allow" ? "deny" : shared === "deny" ? "inherit" : "allow";
}

/** Sets every cell of a row (`columns`) or a column (`subjects`) to one state. */
export function setPermissions(
  value: PermissionValue,
  cells: ReadonlyArray<readonly [subjectId: string, columnId: string]>,
  state: PermissionState,
): PermissionValue {
  let next = value;
  for (const [s, c] of cells) next = setPermission(next, s, c, state);
  return next;
}

/** The cells of one row. */
export const rowCells = (
  subjectId: string,
  columns: ReadonlyArray<PermissionColumn>,
): Array<[string, string]> => columns.map((c) => [subjectId, c.id]);

/** The cells of one column. */
export const columnCells = (
  columnId: string,
  subjects: ReadonlyArray<PermissionSubject>,
): Array<[string, string]> => subjects.map((s) => [s.id, columnId]);

/** One cell that differs between the saved grid and the edited one. */
export interface PermissionChange {
  subjectId: string;
  columnId: string;
  from: PermissionState;
  to: PermissionState;
}

/** The cells that differ between the saved value and the edited one, in grid order. */
export function permissionDiff(
  saved: PermissionValue,
  edited: PermissionValue,
  subjects: ReadonlyArray<PermissionSubject>,
  columns: ReadonlyArray<PermissionColumn>,
): PermissionChange[] {
  const out: PermissionChange[] = [];
  for (const s of subjects)
    for (const c of columns) {
      const from = permissionAt(saved, s.id, c.id);
      const to = permissionAt(edited, s.id, c.id);
      if (from !== to) out.push({ subjectId: s.id, columnId: c.id, from, to });
    }
  return out;
}

const columnName = (c: PermissionColumn) => (c.group ? `${c.group} ${c.label}` : c.label);

/**
 * The grid in words, one line per subject: what it is allowed, what it is denied, and how many it
 * inherits. This is the text alternative of the grid.
 */
export function permissionSummary(
  value: PermissionValue,
  subjects: ReadonlyArray<PermissionSubject>,
  columns: ReadonlyArray<PermissionColumn>,
): Array<{
  subjectId: string;
  name: string;
  allowed: string[];
  denied: string[];
  inherited: number;
  text: string;
}> {
  return subjects.map((s) => {
    const allowed: string[] = [];
    const denied: string[] = [];
    let inherited = 0;
    for (const c of columns) {
      const state = permissionAt(value, s.id, c.id);
      if (state === "allow") allowed.push(columnName(c));
      else if (state === "deny") denied.push(columnName(c));
      else inherited += 1;
    }
    const parts: string[] = [];
    if (allowed.length) parts.push(`allowed: ${allowed.join(", ")}`);
    if (denied.length) parts.push(`denied: ${denied.join(", ")}`);
    if (inherited) parts.push(`${inherited} inherited`);
    return {
      subjectId: s.id,
      name: s.name,
      allowed,
      denied,
      inherited,
      text: `${s.name}, ${parts.join("; ") || "nothing set"}.`,
    };
  });
}

/** How far an arrow, Home or End moves the focus in a grid of `rows` by `cols` cells (headers included). */
export function gridMove(
  at: { row: number; col: number },
  key: string,
  size: { rows: number; cols: number },
  ctrl = false,
): { row: number; col: number } | null {
  const last = { row: size.rows - 1, col: size.cols - 1 };
  const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max);
  switch (key) {
    case "ArrowRight":
      return { row: at.row, col: clamp(at.col + 1, last.col) };
    case "ArrowLeft":
      return { row: at.row, col: clamp(at.col - 1, last.col) };
    case "ArrowDown":
      return { row: clamp(at.row + 1, last.row), col: at.col };
    case "ArrowUp":
      return { row: clamp(at.row - 1, last.row), col: at.col };
    case "Home":
      return ctrl ? { row: 0, col: 0 } : { row: at.row, col: 0 };
    case "End":
      return ctrl ? last : { row: at.row, col: last.col };
    case "PageDown":
      return { row: clamp(at.row + 8, last.row), col: at.col };
    case "PageUp":
      return { row: clamp(at.row - 8, last.row), col: at.col };
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- invitations */

const EMAIL = /^[^\s@<>(),;:"[\]]+@[^\s@<>(),;:"[\]]+\.[^\s@<>(),;:"[\]]{2,}$/;

/** Whether the text is one email address. */
export function isInviteEmail(text: string): boolean {
  return text.length <= 254 && EMAIL.test(text.trim());
}

/** An address as it is compared: trimmed and in lower case, `Name <a@b.co>` reduced to `a@b.co`. */
export function normalizeEmail(text: string): string {
  const angle = /<([^<>]+)>\s*$/.exec(text);
  return (angle ? angle[1]! : text).trim().toLowerCase();
}

/** The addresses in a pasted text (commas, semicolons, spaces and new lines), without duplicates. */
export function parseEmails(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chunk of text.split(/[,;\n]+/)) {
    // "Name <a@b.co>" is one address; otherwise spaces separate.
    const parts = /<[^<>]+>\s*$/.test(chunk) ? [chunk] : chunk.split(/\s+/);
    for (const part of parts) {
      const email = normalizeEmail(part);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      out.push(email);
    }
  }
  return out;
}

export type InviteOutcome = "invited" | "member" | "invalid";

export interface InviteResult {
  email: string;
  outcome: InviteOutcome;
  /** Why, when it is not obvious. */
  detail?: string;
}

/**
 * What would happen to each address: invalid ones are told apart, then those already in `members`.
 * A convenience for apps without a server answer; with one, pass its `result` to the dialog.
 */
export function classifyInvites(
  emails: ReadonlyArray<string>,
  members: ReadonlyArray<string> = [],
): InviteResult[] {
  const known = new Set(members.map(normalizeEmail));
  const seen = new Set<string>();
  const out: InviteResult[] = [];
  for (const raw of emails) {
    const email = normalizeEmail(raw);
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(
      !isInviteEmail(email)
        ? { email: raw.trim(), outcome: "invalid" }
        : known.has(email)
          ? { email, outcome: "member" }
          : { email, outcome: "invited" },
    );
  }
  return out;
}

/** How many results of each outcome. */
export function inviteCounts(results: ReadonlyArray<InviteResult>): Record<InviteOutcome, number> {
  const counts: Record<InviteOutcome, number> = { invited: 0, member: 0, invalid: 0 };
  for (const r of results) counts[r.outcome] += 1;
  return counts;
}

/** The result in one sentence: "2 invited, 1 already a member, 1 invalid". */
export function inviteSummary(results: ReadonlyArray<InviteResult>): string {
  const c = inviteCounts(results);
  const parts = [
    c.invited ? `${c.invited} invited` : "",
    c.member ? `${c.member} already ${c.member === 1 ? "a member" : "members"}` : "",
    c.invalid ? `${c.invalid} invalid` : "",
  ].filter(Boolean);
  return parts.join(", ") || "Nobody invited";
}

/* ---------------------------------------------------------------- export */

export interface ExportFormat {
  value: string;
  label: string;
  description?: string;
}

export const DEFAULT_EXPORT_FORMATS: ReadonlyArray<ExportFormat> = [
  { value: "csv", label: "CSV", description: "Opens in any spreadsheet." },
  { value: "json", label: "JSON", description: "One array, every field." },
  { value: "ndjson", label: "NDJSON", description: "One record per line, for large exports." },
];

export interface ExportColumn {
  id: string;
  label: string;
  hint?: string;
}

export interface ExportRange {
  value: string;
  label: string;
  /** How many rows it holds, when known. */
  count?: number;
}

/** What an export asks for. */
export interface ExportRequest {
  format: string;
  columns: string[];
  range: string;
}

/** Where an export stands, as the app reports it. */
export type ExportState =
  | { status: "idle" }
  | { status: "running"; /** 0 to 1; absent when unknown. */ progress?: number; rows?: number }
  | { status: "done"; href?: string; filename?: string; rows?: number; size?: string }
  | { status: "error"; message: string };

/** What is missing from an export request; null when it can start. */
export function exportProblem(
  request: ExportRequest,
  ranges: ReadonlyArray<ExportRange> = [],
): string | null {
  if (request.columns.length === 0) return "Choose at least one column.";
  const range = ranges.find((r) => r.value === request.range);
  if (range?.count === 0) return "Nothing to export in this range.";
  return null;
}

/** The size of an export in a line: "1,284 rows, 6 columns". */
export function exportPreview(count: number | undefined, columns: number): string {
  const cols = adminPlural(columns, "column");
  return count === undefined ? cols : `${adminPlural(count, "row")}, ${cols}`;
}

/** The columns in their order, reduced to those that are chosen. */
export function orderedColumns(
  all: ReadonlyArray<ExportColumn>,
  chosen: ReadonlyArray<string>,
): string[] {
  return all.filter((c) => chosen.includes(c.id)).map((c) => c.id);
}

/** A file name for an export: `members-2026-11-19.csv`. */
export function exportFilename(base: string, format: string, day: string): string {
  const slug =
    base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "export";
  return `${slug}-${adminDay(day) ?? day}.${format.toLowerCase()}`;
}

/** The percentage of an export, whole; null when the end is not known. */
export function exportPercent(state: ExportState): number | null {
  if (state.status === "done") return 100;
  if (state.status !== "running" || state.progress === undefined) return null;
  return Math.round(Math.min(Math.max(state.progress, 0), 1) * 100);
}

/* ---------------------------------------------------------------- trash */

export interface TrashEntry {
  id: string;
  name: string;
  /** What it was: "Invoice", "Project". */
  kind?: string;
  deletedBy: string;
  /** When: `YYYY-MM-DD` or with a time. */
  deletedAt: string;
}

/** Days left before the item is deleted for good; zero or below means it goes at the next purge. */
export function retentionDaysLeft(deletedAt: string, today: string, retentionDays: number): number {
  const gone = adminDaysBetween(deletedAt, today);
  return gone === null ? retentionDays : retentionDays - gone;
}

/** The time left in words: "30 days left", "1 day left", "Goes today". */
export function retentionText(left: number): string {
  return left <= 0 ? "Goes today" : `${adminPlural(left, "day")} left`;
}

/** Whether the item is close to its end: three days or fewer. */
export const retentionUrgent = (left: number) => left <= 3;

/** The entries, the soonest to go first. */
export function sortByRetention<T extends TrashEntry>(entries: ReadonlyArray<T>): T[] {
  return [...entries].sort((a, b) =>
    (adminDay(a.deletedAt) ?? "").localeCompare(adminDay(b.deletedAt) ?? ""),
  );
}
