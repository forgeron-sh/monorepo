// The model of the administration blocks and its pure helpers: permissions as a grid of
// allow, deny or inherit, notification preferences, invitations, tokens, exports, webhook
// deliveries and the trash. Nothing here knows an app: a console, a people directory or any app
// with settings reads the same. There is no concept of role: a subject (a person, a team) holds a
// state on each permission, and what it does not hold it inherits.

import { addDays, formatShort } from "../dates";

/* ---------------------------------------------------------------- shared */

const DAY = /^(\d{4})-(\d{2})-(\d{2})/;

/** The `YYYY-MM-DD` of a stamp (`2026-11-18`, `2026-11-18T09:12:00Z`, `2026-11-18 09:12`), or null. */
export function adminDay(stamp: string | null | undefined): string | null {
  const m = stamp ? DAY.exec(stamp) : null;
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Whole days from one day to another (negative when `to` is earlier); null when a stamp is not a date. */
export function adminDaysBetween(from: string, to: string): number | null {
  const a = adminDay(from);
  const b = adminDay(to);
  if (!a || !b) return null;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** "Nov 18", with the year when it is not `thisYear`; the text itself when it is not a date. */
export function formatAdminDate(stamp: string, thisYear?: number): string {
  const day = adminDay(stamp);
  return day ? formatShort(day, thisYear) : stamp;
}

/** "today", "yesterday", "3 days ago", "in 2 days": a day told from `today`. */
export function relativeDay(stamp: string, today: string): string {
  const n = adminDaysBetween(today, stamp);
  if (n === null) return stamp;
  if (n === 0) return "today";
  if (n === -1) return "yesterday";
  if (n === 1) return "tomorrow";
  return n < 0 ? `${-n} days ago` : `in ${n} days`;
}

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

/* ---------------------------------------------------------------- notification preferences */

export type DigestFrequency = "off" | "hourly" | "daily" | "weekly";

export const DIGEST_FREQUENCIES: ReadonlyArray<DigestFrequency> = [
  "off",
  "hourly",
  "daily",
  "weekly",
];

export const DIGEST_NAMES: Readonly<Record<DigestFrequency, string>> = {
  off: "Off",
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
};

/** A kind of notification: "A comment mentions you". */
export interface NotificationEvent {
  id: string;
  label: string;
  description?: string;
  /** The section it sits in: "Billing", "Security". */
  group?: string;
}

/** A way to be told: email, push, chat. */
export interface NotificationChannel {
  id: string;
  label: string;
  /** Cannot be turned on (not set up): the column stays, dimmed. */
  unavailable?: boolean;
}

export interface QuietHours {
  enabled: boolean;
  /** `HH:mm`. */
  from: string;
  /** `HH:mm`; earlier than `from` means the night wraps past midnight. */
  to: string;
}

/** What someone chose: the channels of each event, the digest, the quiet hours. */
export interface NotificationPrefs {
  /** The ids of the channels that are on, by event id. */
  channels: Readonly<Record<string, ReadonlyArray<string>>>;
  digest: DigestFrequency;
  quiet: QuietHours;
}

export const DEFAULT_QUIET_HOURS: QuietHours = { enabled: false, from: "22:00", to: "07:00" };

/** No channel on, no digest, no quiet hours. */
export const EMPTY_NOTIFICATION_PREFS: NotificationPrefs = {
  channels: {},
  digest: "off",
  quiet: DEFAULT_QUIET_HOURS,
};

/** Whether an event reaches a channel. */
export function isChannelOn(prefs: NotificationPrefs, eventId: string, channelId: string): boolean {
  return (prefs.channels[eventId] ?? []).includes(channelId);
}

/** One cell turned on or off. */
export function setChannel(
  prefs: NotificationPrefs,
  eventId: string,
  channelId: string,
  on: boolean,
): NotificationPrefs {
  const list = toggleIn(prefs.channels[eventId] ?? [], channelId, on);
  return { ...prefs, channels: { ...prefs.channels, [eventId]: list } };
}

/** A whole channel turned on or off for a group of events. */
export function setChannelForEvents(
  prefs: NotificationPrefs,
  eventIds: ReadonlyArray<string>,
  channelId: string,
  on: boolean,
): NotificationPrefs {
  let next = prefs;
  for (const id of eventIds) next = setChannel(next, id, channelId, on);
  return next;
}

/** Whether a channel is on for all, none or some of a group of events. */
export function channelCoverage(
  prefs: NotificationPrefs,
  eventIds: ReadonlyArray<string>,
  channelId: string,
): "all" | "none" | "some" {
  const on = eventIds.filter((id) => isChannelOn(prefs, id, channelId)).length;
  return on === 0 ? "none" : on === eventIds.length ? "all" : "some";
}

/** The events by group, in order of first appearance; those without a group come first. */
export function groupEvents(
  events: ReadonlyArray<NotificationEvent>,
): Array<{ group: string | null; events: NotificationEvent[] }> {
  const groups = new Map<string | null, NotificationEvent[]>();
  for (const e of events) {
    const key = e.group ?? null;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups]
    .map(([group, list]) => ({ group, events: list }))
    .sort((a, b) => Number(b.group === null) - Number(a.group === null));
}

/** The same preferences, whatever the order of the lists. */
export function samePrefs(a: NotificationPrefs, b: NotificationPrefs): boolean {
  const ids = new Set([...Object.keys(a.channels), ...Object.keys(b.channels)]);
  for (const id of ids) {
    const x = [...(a.channels[id] ?? [])].sort();
    const y = [...(b.channels[id] ?? [])].sort();
    if (x.length !== y.length || x.some((v, i) => v !== y[i])) return false;
  }
  return (
    a.digest === b.digest &&
    a.quiet.enabled === b.quiet.enabled &&
    a.quiet.from === b.quiet.from &&
    a.quiet.to === b.quiet.to
  );
}

const minutesOf = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Whether `now` (`HH:mm`) falls in the quiet hours, a night that wraps past midnight included. */
export function inQuietHours(quiet: QuietHours, now: string): boolean {
  if (!quiet.enabled) return false;
  const [from, to, at] = [minutesOf(quiet.from), minutesOf(quiet.to), minutesOf(now)];
  if (from === null || to === null || at === null || from === to) return false;
  return from < to ? at >= from && at < to : at >= from || at < to;
}

/** The quiet hours in words: "22:00 to 07:00, next day". */
export function quietHoursText(quiet: QuietHours): string {
  const [from, to] = [minutesOf(quiet.from), minutesOf(quiet.to)];
  if (from === null || to === null) return "";
  return `${quiet.from} to ${quiet.to}${to <= from ? ", next day" : ""}`;
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

/* ---------------------------------------------------------------- tokens */

/** A token as the list shows it. The secret is never part of it: it is shown once, at creation. */
export interface ApiToken {
  id: string;
  name: string;
  /** What it may do, as scope ids. */
  scopes: ReadonlyArray<string>;
  createdAt: string;
  /** Null or absent: never used. */
  lastUsedAt?: string | null;
  /** Null or absent: does not expire. */
  expiresAt?: string | null;
  /** The first characters, to recognise it by. Never the whole token. */
  prefix?: string;
}

export interface TokenScope {
  id: string;
  label: string;
  description?: string;
  /** The resource it belongs to, for the group in the picker: "Invoices". */
  group?: string;
}

export type TokenExpiry =
  | { state: "never" }
  | { state: "active" | "soon" | "expired"; days: number };

/** Whether a token has expired, expires within `soonDays`, or does not expire. */
export function tokenExpiry(
  token: Pick<ApiToken, "expiresAt">,
  today: string,
  soonDays = 7,
): TokenExpiry {
  const n = token.expiresAt ? adminDaysBetween(today, token.expiresAt) : null;
  if (n === null) return { state: "never" };
  return { state: n < 0 ? "expired" : n <= soonDays ? "soon" : "active", days: n };
}

/** The expiry in words: "Never", "Expired 3 days ago", "In 12 days". */
export function tokenExpiryText(token: Pick<ApiToken, "expiresAt">, today: string): string {
  const e = tokenExpiry(token, today);
  if (e.state === "never") return "Never";
  if (e.state === "expired") return `Expired ${relativeDay(token.expiresAt!, today)}`;
  return e.days === 0 ? "Today" : `In ${adminPlural(e.days, "day")}`;
}

export interface ExpiryChoice {
  value: string;
  label: string;
  /** Days from today; null for no expiry. */
  days: number | null;
}

export const EXPIRY_CHOICES: ReadonlyArray<ExpiryChoice> = [
  { value: "7", label: "7 days", days: 7 },
  { value: "30", label: "30 days", days: 30 },
  { value: "90", label: "90 days", days: 90 },
  { value: "365", label: "1 year", days: 365 },
  { value: "never", label: "Never", days: null },
];

/** The day a choice ends: `YYYY-MM-DD`, or null for never. */
export function expiryDay(today: string, days: number | null): string | null {
  return days === null ? null : addDays(adminDay(today) ?? today, days);
}

export interface NewTokenInput {
  name: string;
  scopes: string[];
  expiresAt: string | null;
}

/** What is missing from a new token; empty when it can be created. */
export function tokenProblems(
  input: NewTokenInput,
  existing: ReadonlyArray<Pick<ApiToken, "name">> = [],
): { name?: string; scopes?: string } {
  const out: { name?: string; scopes?: string } = {};
  const name = input.name.trim();
  if (!name) out.name = "Give the token a name.";
  else if (name.length > 60) out.name = "Keep the name under 60 characters.";
  else if (existing.some((t) => t.name.trim().toLowerCase() === name.toLowerCase()))
    out.name = "A token has this name already.";
  if (input.scopes.length === 0) out.scopes = "Choose at least one scope.";
  return out;
}

/** The scopes to show in a row: the first `max`, and how many are left. */
export function visibleScopes(
  scopes: ReadonlyArray<string>,
  max = 3,
): { shown: string[]; more: number } {
  return { shown: scopes.slice(0, max), more: Math.max(scopes.length - max, 0) };
}

/** The scopes grouped by resource, in order of first appearance. */
export function groupScopes(
  scopes: ReadonlyArray<TokenScope>,
): Array<{ group: string | null; scopes: TokenScope[] }> {
  const groups = new Map<string | null, TokenScope[]>();
  for (const s of scopes) groups.set(s.group ?? null, [...(groups.get(s.group ?? null) ?? []), s]);
  return [...groups].map(([group, list]) => ({ group, scopes: list }));
}

/* ---------------------------------------------------------------- secrets */

/** What stands for a hidden secret, whatever its length: nothing about the value leaks. */
export const SECRET_MASK = "••••••••••••";

/** How long a revealed secret stays on screen, in milliseconds. */
export const SECRET_REVEAL_MS = 15_000;

/** Whole seconds left before `hideAt`, never below zero. */
export function secondsLeft(now: number, hideAt: number): number {
  return Math.max(Math.ceil((hideAt - now) / 1000), 0);
}

/** Whether a value can be saved as a secret: not empty, no line break, not only spaces. */
export function secretProblem(value: string): string | null {
  if (!value.trim()) return "Type the new value.";
  if (/[\r\n]/.test(value)) return "A secret is one line.";
  return null;
}

/* ---------------------------------------------------------------- webhooks */

export type EndpointStatus = "active" | "disabled" | "failing";

export const ENDPOINT_STATUS_NAMES: Readonly<Record<EndpointStatus, string>> = {
  active: "Active",
  disabled: "Disabled",
  failing: "Failing",
};

/** A URL the app calls when something happens. */
export interface WebhookEndpoint {
  id: string;
  url: string;
  /** A name for the list and for assistive technology: "Billing sync". */
  name?: string;
  description?: string;
  /** The events it listens to: `invoice.paid`. */
  events: ReadonlyArray<string>;
  status: EndpointStatus;
  /** When it was last called: `YYYY-MM-DD HH:MM`. */
  lastDeliveryAt?: string;
  /** Its signing secret: whether one is set, and when it changed. The value is read on demand. */
  secret?: { isSet: boolean; rotatedAt?: string };
}

export type DeliveryStatus = "success" | "failed" | "retrying" | "pending";

export const DELIVERY_STATUS_NAMES: Readonly<Record<DeliveryStatus, string>> = {
  success: "Delivered",
  failed: "Failed",
  retrying: "Retrying",
  pending: "Pending",
};

export const DELIVERY_TONES: Readonly<
  Record<DeliveryStatus, "success" | "danger" | "warning" | "neutral">
> = {
  success: "success",
  failed: "danger",
  retrying: "warning",
  pending: "neutral",
};

/** A call of a webhook endpoint. */
export interface WebhookDelivery {
  id: string;
  /** The event that fired it: `invoice.paid`. */
  event: string;
  /** When: `YYYY-MM-DD HH:MM`. */
  at: string;
  status: DeliveryStatus;
  /** The HTTP status code of the answer, when there was one. */
  code?: number;
  durationMs?: number;
  attempts: number;
  /** The URL it was sent to, when the log covers several endpoints. */
  url?: string;
  /** The body that was sent. */
  request?: unknown;
  /** The body that came back, or the error. */
  response?: unknown;
}

/** "84 ms", "1.2 s", "2 min"; an em dash when unknown. */
export function formatDeliveryDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

/** The answer of a delivery in a few characters: `200`, `503`, or the status when there is no code. */
export function deliveryCodeText(d: Pick<WebhookDelivery, "code" | "status">): string {
  return d.code !== undefined ? String(d.code) : d.status === "pending" ? "—" : "no answer";
}

export type DeliveryFilter = "all" | "failed";

/** The deliveries to show: every one, or those that failed or are being retried. */
export function filterDeliveries(
  list: ReadonlyArray<WebhookDelivery>,
  filter: DeliveryFilter,
): WebhookDelivery[] {
  return filter === "all"
    ? [...list]
    : list.filter((d) => d.status === "failed" || d.status === "retrying");
}

/** How many deliveries of each status. */
export function deliveryCounts(
  list: ReadonlyArray<WebhookDelivery>,
): Record<DeliveryStatus, number> {
  const out: Record<DeliveryStatus, number> = { success: 0, failed: 0, retrying: 0, pending: 0 };
  for (const d of list) out[d.status] += 1;
  return out;
}

/** A delivery can be sent again once it has an answer, good or bad. */
export const canRedeliver = (d: Pick<WebhookDelivery, "status">) => d.status !== "pending";

/** The events of an endpoint to show: the first `max`, and how many are left. */
export function visibleEvents(events: ReadonlyArray<string>, max = 3) {
  return visibleScopes(events, max);
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
