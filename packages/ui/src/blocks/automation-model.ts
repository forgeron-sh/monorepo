// The model of the automation blocks, after the Flows prototype: steps and their branches,
// `{{ step.field }}` references, schedules as cron, conditions, runs. Pure functions, no React:
// an app (or the `@forgeron/flow` node editor) can use them on their own.

import type { IconDefinition } from "@forgeron/icons";

/* ---------------------------------------------------------------- Steps */

/** What a step is: what starts the automation, what it does, or how it routes. */
export type StepKind = "trigger" | "action" | "logic";

/** Where a step stands in a run (or a test): `idle` before anything ran. */
/** `handled`: the step failed and its failure went on to a handler (a retry): still a failure. */
export type StepStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "handled"
  | "skipped"
  | "reused";

export interface AutomationStep {
  id: string;
  /** The name of this step in this automation: `Notify the sales team`. */
  title: string;
  /** What it calls, in mono: `Chat · postMessage()`. */
  subtitle?: string;
  icon: IconDefinition;
  kind?: StepKind;
  status?: StepStatus;
  /** After a run: `120 ms · 3 items`. */
  meta?: string;
  /** The error of the last run, in one line. */
  error?: string;
  /** Items pass through unchanged. */
  disabled?: boolean;
  /** The paths of an If or a Switch, each a list of steps. */
  branches?: ReadonlyArray<StepBranch>;
}

export interface StepBranch {
  /** Unique across the automation: it names the list a step goes into. */
  id: string;
  /** `true`, `false`, `billing`, `fallback`. */
  label: string;
  steps: ReadonlyArray<AutomationStep>;
}

/** A place in the tree: the index in the top list, or in a branch. */
export interface StepPlace {
  branch?: string;
  index: number;
}

type Steps = ReadonlyArray<AutomationStep>;

const mapLists = (steps: Steps, fn: (list: Steps, branch: string | undefined) => Steps): Steps => {
  const walk = (list: Steps, branch: string | undefined): Steps =>
    fn(list, branch).map((s) =>
      s.branches
        ? { ...s, branches: s.branches.map((b) => ({ ...b, steps: walk(b.steps, b.id) })) }
        : s,
    );
  return walk(steps, undefined);
};

/** The step with this id, wherever it is, with its place. */
export function findStep(
  steps: Steps,
  id: string,
): { step: AutomationStep; place: StepPlace } | null {
  const walk = (list: Steps, branch: string | undefined): ReturnType<typeof findStep> => {
    for (let index = 0; index < list.length; index++) {
      const step = list[index]!;
      if (step.id === id) return { step, place: branch ? { branch, index } : { index } };
      for (const b of step.branches ?? []) {
        const found = walk(b.steps, b.id);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(steps, undefined);
}

/** Every step in reading order, branches included: the order the keyboard follows. */
export function flattenSteps(steps: Steps): AutomationStep[] {
  return steps.flatMap((s) => [s, ...(s.branches ?? []).flatMap((b) => flattenSteps(b.steps))]);
}

/** A copy with `step` inserted at `place` (the end of the list when the index is past it). */
export function insertStep(steps: Steps, step: AutomationStep, place: StepPlace): Steps {
  return mapLists(steps, (list, branch) => {
    if (branch !== place.branch) return list;
    const at = Math.max(0, Math.min(place.index, list.length));
    return [...list.slice(0, at), step, ...list.slice(at)];
  });
}

/** A copy without the step (and what is under it). */
export function removeStep(steps: Steps, id: string): Steps {
  return mapLists(steps, (list) => list.filter((s) => s.id !== id));
}

/** A copy with the step moved up (`-1`) or down (`1`) in its own list; unchanged at an end. */
export function moveStep(steps: Steps, id: string, delta: -1 | 1): Steps {
  return mapLists(steps, (list) => {
    const i = list.findIndex((s) => s.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  });
}

/** A copy with fields of one step replaced. */
export function updateStep(steps: Steps, id: string, patch: Partial<AutomationStep>): Steps {
  return mapLists(steps, (list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

/* ---------------------------------------------------------------- References: {{ step.field }} */

/** One reference in a text: where it is and the path it reads. */
export interface TokenRange {
  from: number;
  to: number;
  path: string;
}

/** The `{{ … }}` of a text, in order. */
export function findTokens(text: string): TokenRange[] {
  const out: TokenRange[] = [];
  for (const m of text.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)) {
    out.push({ from: m.index, to: m.index + m[0].length, path: m[1] ?? "" });
  }
  return out;
}

/** The reference being typed at the caret (`{{ deal.am|`): where its path starts, and the query. */
export function tokenQueryAt(text: string, caret: number): { from: number; query: string } | null {
  const m = /\{\{\s*([\w.$[\]-]*)$/.exec(text.slice(0, caret));
  if (!m) return null;
  const query = m[1] ?? "";
  return { from: caret - query.length, query };
}

/**
 * Writes `path` in place of `text[from, to)`, closing the reference unless it is closed already,
 * and gives the new text and where the caret goes (after the `}}`).
 */
export function insertToken(
  text: string,
  from: number,
  to: number,
  path: string,
): { text: string; caret: number } {
  const before = text.slice(0, from);
  const after = text.slice(to);
  const open = /\{\{$/.test(before) ? " " : "";
  const closed = /^\s*\}\}/.exec(after);
  const close = closed ? "" : " }}";
  const next = `${before}${open}${path}${close}${after}`;
  const caret =
    before.length + open.length + path.length + (closed ? closed[0].length : close.length);
  return { text: next, caret };
}

/** A reference to put in a text: `{{ deal.amount }}`. */
export const tokenOf = (path: string) => `{{ ${path} }}`;

/** Reads `a.b.0.c` in a value; `undefined` when a part is missing. */
export function getPath(value: unknown, path: string): unknown {
  let cur: unknown = value;
  for (const part of path.split(".").filter(Boolean)) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * The text with its references read from `data`. A text that is one reference alone gives the
 * value itself (a number stays a number); `missing` lists the paths that read nothing.
 */
export function resolveTemplate(
  text: string,
  data: unknown,
): { value: unknown; missing: string[] } {
  const tokens = findTokens(text);
  const missing: string[] = [];
  const read = (path: string) => {
    const v = getPath(data, path);
    if (v === undefined) missing.push(path);
    return v;
  };
  const only = tokens[0];
  if (tokens.length === 1 && only && only.from === 0 && only.to === text.length) {
    return { value: read(only.path), missing };
  }
  let out = "";
  let at = 0;
  for (const t of tokens) {
    const v = read(t.path);
    out +=
      text.slice(at, t.from) +
      (v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
    at = t.to;
  }
  return { value: out + text.slice(at), missing };
}

/** One value a previous step gives, to insert as a reference. */
export interface VariableField {
  /** The full path: `deal.amount`. */
  path: string;
  /** A type or an example, shown at the end of the row: `number`, `9600`. */
  hint?: string;
}

/** The outputs of one previous step (or the trigger), as a group of the variable list. */
export interface VariableSource {
  /** The output variable of the step: `deal`. */
  id: string;
  /** The step: `Deal moved to Won`. */
  label: string;
  icon?: IconDefinition;
  fields: ReadonlyArray<VariableField>;
}

/** The paths of a sample output, each with its value as hint: what a step gave in a test run. */
export function variablesFromSample(
  id: string,
  label: string,
  sample: unknown,
  icon?: IconDefinition,
): VariableSource {
  const fields: VariableField[] = [];
  const walk = (v: unknown, path: string, depth: number) => {
    if (depth > 4) return;
    if (Array.isArray(v)) {
      fields.push({ path, hint: `${v.length} items` });
      return;
    }
    if (v !== null && typeof v === "object") {
      for (const [k, child] of Object.entries(v)) walk(child, `${path}.${k}`, depth + 1);
      return;
    }
    fields.push({ path, hint: v === null ? "null" : String(v) });
  };
  walk(sample, id, 0);
  return { id, label, fields, ...(icon ? { icon } : {}) };
}

/* ---------------------------------------------------------------- Schedules: cron */

interface CronSets {
  minute: number[];
  hour: number[];
  day: number[];
  month: number[];
  weekday: number[];
  /** Day of month and day of week both restricted: either one matches (as in cron). */
  either: boolean;
}

const RANGES: ReadonlyArray<[number, number]> = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
];

function parseField(field: string, [lo, hi]: [number, number]): number[] | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const m = /^(\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/.exec(part);
    if (!m) return null;
    const step = m[4] ? Number(m[4]) : 1;
    let a = lo;
    let b = hi;
    if (m[1] !== "*") {
      a = Number(m[2]);
      b = m[3] !== undefined ? Number(m[3]) : m[4] ? hi : a;
    }
    if (step < 1 || a < lo || b > hi || a > b) return null;
    for (let v = a; v <= b; v += step) out.add(v);
  }
  return [...out].sort((x, y) => x - y);
}

/** The five fields of a cron expression as sets, or `null` when it is not one. */
export function parseCron(expr: string): CronSets | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const sets = parts.map((p, i) => parseField(p, RANGES[i]!));
  if (sets.some((s) => s === null)) return null;
  const [minute, hour, day, month, wd] = sets as number[][];
  const weekday = [...new Set(wd!.map((d) => d % 7))].sort((x, y) => x - y);
  return {
    minute: minute!,
    hour: hour!,
    day: day!,
    month: month!,
    weekday,
    either: parts[2] !== "*" && parts[4] !== "*",
  };
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const ordinal = (n: number) =>
  `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
const andList = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** A cron expression in words: `Weekdays at 08:00`. `null` when the expression is invalid. */
export function describeCron(expr: string): string | null {
  const sets = parseCron(expr);
  if (!sets) return null;
  const [m, h, dom, mon, dow] = expr.trim().split(/\s+/) as [
    string,
    string,
    string,
    string,
    string,
  ];
  const every = /^\*\/(\d+)$/;
  if (mon !== "*") return "Custom schedule";
  if (h === "*" && dom === "*" && dow === "*") {
    if (m === "*") return "Every minute";
    const e = every.exec(m);
    if (e) return Number(e[1]) === 1 ? "Every minute" : `Every ${e[1]} minutes`;
    if (/^\d+$/.test(m)) return m === "0" ? "Every hour" : `Every hour at :${pad(Number(m))}`;
    return "Custom schedule";
  }
  if (!/^\d+$/.test(m)) return "Custom schedule";
  const e = every.exec(h);
  if (e && dom === "*" && dow === "*") {
    const at = m === "0" ? "" : ` at :${pad(Number(m))}`;
    return Number(e[1]) === 1 ? `Every hour${at}` : `Every ${e[1]} hours${at}`;
  }
  if (!/^\d+(,\d+)*$/.test(h)) return "Custom schedule";
  const times = andList(sets.hour.map((x) => `${pad(x)}:${pad(sets.minute[0]!)}`));
  if (dom === "*" && dow === "*") return `Every day at ${times}`;
  if (dom === "*") {
    const days = sets.weekday;
    if (days.join() === "1,2,3,4,5") return `Weekdays at ${times}`;
    if (days.join() === "0,6") return `Weekends at ${times}`;
    if (days.length === 7) return `Every day at ${times}`;
    return `${andList(days.map((d) => `${WEEKDAY_NAMES[d]}s`))} at ${times}`;
  }
  if (dow === "*" && /^\d+(,\d+)*$/.test(dom)) {
    return `Monthly on the ${andList(sets.day.map(ordinal))} at ${times}`;
  }
  return "Custom schedule";
}

const toUtc = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(iso);
  if (!m) return NaN;
  return Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!);
};
const fromUtc = (t: number) => {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

/**
 * The next times the expression fires after `from` (`YYYY-MM-DDTHH:MM`, wall clock of the
 * schedule's timezone), as `YYYY-MM-DDTHH:MM`. Looks up to four years ahead.
 */
export function nextRuns(expr: string, from: string, count = 3): string[] {
  const sets = parseCron(expr);
  const start = toUtc(from);
  if (!sets || Number.isNaN(start)) return [];
  const out: string[] = [];
  const day0 = Math.floor(start / 86_400_000) * 86_400_000;
  for (let d = 0; d < 366 * 4 && out.length < count; d++) {
    const t = day0 + d * 86_400_000;
    const date = new Date(t);
    if (!sets.month.includes(date.getUTCMonth() + 1)) continue;
    const domOk = sets.day.includes(date.getUTCDate());
    const dowOk = sets.weekday.includes(date.getUTCDay());
    if (sets.either ? !(domOk || dowOk) : !(domOk && dowOk)) continue;
    for (const h of sets.hour) {
      for (const m of sets.minute) {
        const at = t + h * 3_600_000 + m * 60_000;
        if (at <= start) continue;
        out.push(fromUtc(at));
        if (out.length >= count) return out;
      }
    }
  }
  return out;
}

/** The shapes of the schedule editor; anything else is written as cron. */
export type ScheduleSpec =
  | { mode: "minutes"; every: number }
  | { mode: "hours"; every: number; minute: number }
  | { mode: "daily"; time: string }
  | { mode: "weekly"; days: number[]; time: string }
  | { mode: "monthly"; day: number; time: string }
  | { mode: "cron"; cron: string };

const hm = (time: string) => {
  const [h = "0", m = "0"] = time.split(":");
  return { h: Number(h), m: Number(m) };
};

/** The cron expression of a schedule. */
export function specToCron(spec: ScheduleSpec): string {
  switch (spec.mode) {
    case "minutes":
      return spec.every <= 1 ? "* * * * *" : `*/${spec.every} * * * *`;
    case "hours":
      return `${spec.minute} ${spec.every <= 1 ? "*" : `*/${spec.every}`} * * *`;
    case "daily": {
      const { h, m } = hm(spec.time);
      return `${m} ${h} * * *`;
    }
    case "weekly": {
      const { h, m } = hm(spec.time);
      const days = [...spec.days].sort((a, b) => a - b);
      return `${m} ${h} * * ${days.length ? days.join(",") : "*"}`;
    }
    case "monthly": {
      const { h, m } = hm(spec.time);
      return `${m} ${h} ${spec.day} * *`;
    }
    case "cron":
      return spec.cron;
  }
}

/** The schedule a cron expression reads as, `cron` mode when it fits no simpler shape. */
export function cronToSpec(expr: string): ScheduleSpec {
  const parts = expr.trim().split(/\s+/);
  const asCron: ScheduleSpec = { mode: "cron", cron: expr };
  if (parts.length !== 5 || !parseCron(expr)) return asCron;
  const [m, h, dom, mon, dow] = parts as [string, string, string, string, string];
  if (mon !== "*") return asCron;
  const num = /^\d+$/;
  const every = /^\*\/(\d+)$/;
  if (h === "*" && dom === "*" && dow === "*") {
    if (m === "*") return { mode: "minutes", every: 1 };
    const e = every.exec(m);
    if (e) return { mode: "minutes", every: Number(e[1]) };
    if (num.test(m)) return { mode: "hours", every: 1, minute: Number(m) };
    return asCron;
  }
  if (!num.test(m)) return asCron;
  const e = every.exec(h);
  if (e && dom === "*" && dow === "*")
    return { mode: "hours", every: Number(e[1]), minute: Number(m) };
  if (!num.test(h)) return asCron;
  const time = `${pad(Number(h))}:${pad(Number(m))}`;
  if (dom === "*" && dow === "*") return { mode: "daily", time };
  if (dom === "*" && /^[\d,-]+$/.test(dow)) {
    return { mode: "weekly", days: parseCron(expr)!.weekday, time };
  }
  if (dow === "*" && num.test(dom)) return { mode: "monthly", day: Number(dom), time };
  return asCron;
}

/* ---------------------------------------------------------------- Conditions */

export type ConditionFieldType = "text" | "number" | "date" | "boolean" | "enum";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "before"
  | "after"
  | "is_true"
  | "is_false"
  | "empty"
  | "not_empty";

export interface ConditionField {
  /** The path read in the item: `deal.amount`. */
  id: string;
  label: string;
  type: ConditionFieldType;
  /** The choices of an `enum` field. */
  options?: ReadonlyArray<{ value: string; label: string }>;
  icon?: IconDefinition;
}

export interface ConditionRule {
  id: string;
  field: string;
  operator: ConditionOperator;
  /** Text as typed; may hold `{{ references }}`. */
  value?: string;
}

export interface ConditionGroup {
  id: string;
  combinator: "and" | "or";
  rules: ReadonlyArray<ConditionRule | ConditionGroup>;
}

export const isConditionGroup = (x: ConditionRule | ConditionGroup): x is ConditionGroup =>
  "rules" in x;

/** The words of each operator, as read in a sentence: `Amount is more than 5000`. */
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: "is",
  neq: "is not",
  gt: "is more than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  before: "is before",
  after: "is after",
  is_true: "is true",
  is_false: "is false",
  empty: "is empty",
  not_empty: "is not empty",
};

/** The operators that make sense for each type of field, the usual one first. */
export const OPERATORS_BY_TYPE: Record<ConditionFieldType, ReadonlyArray<ConditionOperator>> = {
  text: ["eq", "neq", "contains", "not_contains", "starts_with", "empty", "not_empty"],
  number: ["gt", "gte", "lt", "lte", "eq", "neq", "empty", "not_empty"],
  date: ["before", "after", "eq", "empty", "not_empty"],
  boolean: ["is_true", "is_false"],
  enum: ["eq", "neq", "empty", "not_empty"],
};

/** Whether the operator compares to a value (`is empty` does not). */
export const operatorTakesValue = (op: ConditionOperator) =>
  !["is_true", "is_false", "empty", "not_empty"].includes(op);

function testRule(rule: ConditionRule, actual: unknown): boolean {
  const value = rule.value ?? "";
  const isEmpty = actual === undefined || actual === null || actual === "";
  const a = typeof actual === "string" ? actual : actual == null ? "" : String(actual);
  const na = Number(actual);
  const nb = Number(value);
  const numeric = !isEmpty && value !== "" && !Number.isNaN(na) && !Number.isNaN(nb);
  switch (rule.operator) {
    case "eq":
      return numeric ? na === nb : a === value;
    case "neq":
      return numeric ? na !== nb : a !== value;
    case "gt":
      return numeric && na > nb;
    case "gte":
      return numeric && na >= nb;
    case "lt":
      return numeric && na < nb;
    case "lte":
      return numeric && na <= nb;
    case "contains":
      return a.toLowerCase().includes(value.toLowerCase());
    case "not_contains":
      return !a.toLowerCase().includes(value.toLowerCase());
    case "starts_with":
      return a.toLowerCase().startsWith(value.toLowerCase());
    case "before":
      return !isEmpty && a < value;
    case "after":
      return !isEmpty && a > value;
    case "is_true":
      return actual === true || a === "true";
    case "is_false":
      return actual === false || a === "false";
    case "empty":
      return isEmpty || (Array.isArray(actual) && actual.length === 0);
    case "not_empty":
      return !(isEmpty || (Array.isArray(actual) && actual.length === 0));
  }
}

/** Whether an item passes the condition. An empty group passes. */
export function evaluateCondition(group: ConditionGroup, item: unknown): boolean {
  if (group.rules.length === 0) return true;
  const results = group.rules.map((r) =>
    isConditionGroup(r) ? evaluateCondition(r, item) : testRule(r, getPath(item, r.field)),
  );
  return group.combinator === "and" ? results.every(Boolean) : results.some(Boolean);
}

/** The condition in one line: `Amount is more than 5000 and (Stage is Won or …)`. */
export function describeCondition(
  group: ConditionGroup,
  fields: ReadonlyArray<ConditionField>,
): string {
  const parts = group.rules.map((r) => {
    if (isConditionGroup(r)) return `(${describeCondition(r, fields)})`;
    const field = fields.find((f) => f.id === r.field);
    const label = field?.label ?? r.field;
    if (!operatorTakesValue(r.operator)) return `${label} ${OPERATOR_LABELS[r.operator]}`;
    const shown = field?.options?.find((o) => o.value === r.value)?.label ?? r.value ?? "";
    return `${label} ${OPERATOR_LABELS[r.operator]} ${shown || "…"}`;
  });
  return parts.length ? parts.join(` ${group.combinator} `) : "Always";
}

/* ---------------------------------------------------------------- Runs */

export type RunStatus = "queued" | "running" | "success" | "error" | "cancelled";

/** `120 ms`, `1.4 s`, `2 min 05 s`. */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  const min = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${min} min ${pad(s)} s`;
}

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

/** The LED tone and the word of a step or run status: never colour alone. */
export function statusLook(status: StepStatus | RunStatus): { tone: Tone; word: string } {
  switch (status) {
    case "success":
      return { tone: "success", word: "Succeeded" };
    case "error":
      return { tone: "danger", word: "Failed" };
    case "handled":
      return { tone: "danger", word: "Failed · handled" };
    case "running":
      return { tone: "accent", word: "Running" };
    case "queued":
      return { tone: "neutral", word: "Queued" };
    case "cancelled":
      return { tone: "warning", word: "Cancelled" };
    case "skipped":
      return { tone: "neutral", word: "Not reached" };
    case "reused":
      return { tone: "success", word: "Reused" };
    case "idle":
      return { tone: "neutral", word: "Not run" };
  }
}

/** A change between two versions of an automation: added, removed, modified. */
export interface VersionChange {
  kind: "add" | "remove" | "change";
  text: string;
}
