// The model of the approval blocks and its pure helpers: who has to act, in which order, what each
// status is, where fields sit on a page. Nothing here knows an app: a signature, an expense, a
// time-off request or a publication all read as a chain of steps with people in them.

import type { IconDefinition } from "@forgeron/icons";
import {
  Calendar01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  MinusSignIcon,
  Pen01Icon,
  Cancel01Icon,
  TextAlignLeftIcon,
  Tick01Icon,
  TextIcon,
  HourglassIcon,
} from "@forgeron/icons";

/* ---------------------------------------------------------------- statuses and people */

/** Where someone stands in a chain. */
export type ApprovalStatus = "waiting" | "current" | "approved" | "rejected" | "skipped";

export const APPROVAL_STATUSES: ReadonlyArray<ApprovalStatus> = [
  "waiting",
  "current",
  "approved",
  "rejected",
  "skipped",
];

/** The words for each status; every component takes `statusLabels` to say them another way. */
export const APPROVAL_STATUS_NAMES: Readonly<Record<ApprovalStatus, string>> = {
  waiting: "Waiting",
  current: "To act",
  approved: "Approved",
  rejected: "Rejected",
  skipped: "Skipped",
};

/** The pixel icon and the badge tone of each status. */
export const APPROVAL_STATUS_MARKS: Readonly<
  Record<
    ApprovalStatus,
    { icon: IconDefinition; tone: "neutral" | "strong" | "success" | "danger" }
  >
> = {
  waiting: { icon: Clock01Icon, tone: "neutral" },
  current: { icon: HourglassIcon, tone: "strong" },
  approved: { icon: Tick01Icon, tone: "success" },
  rejected: { icon: Cancel01Icon, tone: "danger" },
  skipped: { icon: MinusSignIcon, tone: "neutral" },
};

/** A person in a chain, a list or on a document. */
export interface ApprovalParticipant {
  id: string;
  name: string;
  /** What they do here: "Signer", "Manager", "Reviewer". */
  role?: string;
  email?: string;
  /** Left out, it is found from the chain (`resolveChain`). */
  status?: ApprovalStatus;
  /** When they acted: an ISO date or timestamp. */
  at?: string;
  /** When they were last reminded. */
  reminded?: string;
}

export interface ApprovalComment {
  id: string;
  author: string;
  /** ISO date or timestamp. */
  at: string;
  text: string;
}

/** `sequential`: one after the other, in the order listed; `parallel`: all at once. */
export type StepMode = "sequential" | "parallel";

export interface ApprovalStep {
  id: string;
  label?: string;
  /** How the people of this step go; `sequential` by default. */
  mode?: StepMode;
  participants: ReadonlyArray<ApprovalParticipant>;
  /** ISO date. */
  due?: string;
  comments?: ReadonlyArray<ApprovalComment>;
}

/** One line of the audit of an approval. */
export interface ApprovalEvent {
  id: string;
  /** ISO timestamp. */
  at: string;
  actor: string;
  /** "Approved", "Reminded Léa", "Added Karim". */
  action: string;
  detail?: string;
  tone?: "neutral" | "success" | "danger";
}

const FINAL: ReadonlySet<ApprovalStatus> = new Set(["approved", "rejected", "skipped"]);

/** True once the person has nothing left to do: approved, rejected or skipped. */
export const isFinalStatus = (status: ApprovalStatus | undefined): boolean =>
  status !== undefined && FINAL.has(status);

/**
 * Fills the status nobody gave. Steps go in order: while a step is not over, the next ones wait,
 * and a rejection stops the chain. In a `sequential` step the first person left is current; in a
 * `parallel` step everyone left is. A status given is kept.
 */
export function resolveChain(steps: ReadonlyArray<ApprovalStep>): ApprovalStep[] {
  let blocked = false;
  return steps.map((step) => {
    const parallel = step.mode === "parallel";
    let someoneCurrent = false;
    let rejected = false;
    let open = false;
    const participants = step.participants.map((p) => {
      let status: ApprovalStatus;
      if (p.status !== undefined) status = p.status;
      else if (blocked) status = "waiting";
      else if (parallel) status = "current";
      else status = !someoneCurrent && !open ? "current" : "waiting";
      if (!isFinalStatus(status)) {
        if (status === "current") someoneCurrent = true;
        open = true;
      }
      if (status === "rejected") rejected = true;
      return p.status === status ? p : { ...p, status };
    });
    if (rejected || open) blocked = true;
    return { ...step, participants };
  });
}

/** The status of a step from its people (resolved first with `resolveChain`). */
export function stepStatus(step: ApprovalStep): ApprovalStatus {
  const list = step.participants;
  if (list.some((p) => p.status === "rejected")) return "rejected";
  if (list.length === 0) return "waiting";
  if (list.every((p) => p.status === "skipped")) return "skipped";
  if (list.every((p) => isFinalStatus(p.status))) return "approved";
  if (list.some((p) => p.status === "current")) return "current";
  return "waiting";
}

/** The status of the whole chain: rejected, done, in progress, or not started. */
export function chainStatus(steps: ReadonlyArray<ApprovalStep>): ApprovalStatus {
  const resolved = resolveChain(steps);
  const all = resolved.map(stepStatus);
  if (all.includes("rejected")) return "rejected";
  if (all.length === 0) return "waiting";
  if (all.every((s) => s === "approved" || s === "skipped")) {
    return all.every((s) => s === "skipped") ? "skipped" : "approved";
  }
  return all.includes("current") ? "current" : "waiting";
}

/** How many people have approved, of how many are asked (the skipped do not count). */
export function chainProgress(steps: ReadonlyArray<ApprovalStep>): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const step of steps) {
    for (const p of step.participants) {
      if (p.status === "skipped") continue;
      total += 1;
      if (p.status === "approved") done += 1;
    }
  }
  return { done, total };
}

/** The people whose turn it is, across the chain. */
export function currentParticipants(steps: ReadonlyArray<ApprovalStep>): ApprovalParticipant[] {
  return resolveChain(steps).flatMap((s) => s.participants.filter((p) => p.status === "current"));
}

/** True when `due` (`YYYY-MM-DD`) is before `today` and the step is not over. */
export function isOverdue(due: string | undefined, today: string, status: ApprovalStatus): boolean {
  if (!due || isFinalStatus(status)) return false;
  return due.slice(0, 10) < today.slice(0, 10);
}

/* ---------------------------------------------------------------- editing a list */

/** A copy of `list` with the item at `from` moved to `to`; out of range, the list as it is. */
export function moveItem<T>(list: ReadonlyArray<T>, from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) {
    return [...list];
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** The item with `id` moved by `delta` places (-1 up, +1 down). */
export function moveById<T extends { id: string }>(
  list: ReadonlyArray<T>,
  id: string,
  delta: number,
): T[] {
  const from = list.findIndex((x) => x.id === id);
  if (from < 0) return [...list];
  return moveItem(list, from, Math.min(Math.max(from + delta, 0), list.length - 1));
}

/** Adds a person to a step, unless they are already somewhere in the chain. */
export function addParticipant(
  steps: ReadonlyArray<ApprovalStep>,
  stepId: string,
  person: ApprovalParticipant,
): ApprovalStep[] {
  if (steps.some((s) => s.participants.some((p) => p.id === person.id))) return [...steps];
  return steps.map((s) =>
    s.id === stepId ? { ...s, participants: [...s.participants, person] } : s,
  );
}

/** Removes a person from the chain. */
export function removeParticipant(steps: ReadonlyArray<ApprovalStep>, id: string): ApprovalStep[] {
  return steps.map((s) =>
    s.participants.some((p) => p.id === id)
      ? { ...s, participants: s.participants.filter((p) => p.id !== id) }
      : s,
  );
}

/** Replaces the people of a step, in the order given. */
export function setParticipants(
  steps: ReadonlyArray<ApprovalStep>,
  stepId: string,
  participants: ReadonlyArray<ApprovalParticipant>,
): ApprovalStep[] {
  return steps.map((s) => (s.id === stepId ? { ...s, participants } : s));
}

/** Switches a step between `sequential` and `parallel`. */
export function setStepMode(
  steps: ReadonlyArray<ApprovalStep>,
  stepId: string,
  mode: StepMode,
): ApprovalStep[] {
  return steps.map((s) => (s.id === stepId ? { ...s, mode } : s));
}

/** The next free id of the form `prefix-n`. */
export function nextId(ids: ReadonlyArray<string>, prefix: string): string {
  let n = ids.length + 1;
  while (ids.includes(`${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
}

/* ---------------------------------------------------------------- colours of people */

/** One colour per person, from the tokens; a number always goes with it, never colour alone. */
export const PARTICIPANT_TONES: ReadonlyArray<string> = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--ink)",
  "var(--ink-muted)",
  "var(--ink-dim)",
];

/** The colour of the person at `index`; it comes round after seven. */
export const participantTone = (index: number): string =>
  PARTICIPANT_TONES[((index % PARTICIPANT_TONES.length) + PARTICIPANT_TONES.length) % 7]!;

/* ---------------------------------------------------------------- dates */

/** `2026-11-19T14:32:10Z` as `2026-11-19 14:32 UTC`; a plain date stays a date. */
export function formatStamp(iso: string): string {
  const hit =
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(
      iso.trim(),
    );
  if (!hit) return iso;
  const [, date, time, zone] = hit;
  if (!time) return date!;
  const z = zone === "Z" ? " UTC" : zone ? ` ${zone}` : "";
  return `${date} ${time}${z}`;
}

/** The first `length` characters of a hash, in groups of four: `a3f9 1c07`. */
export function hashPrefix(hash: string, length = 8): string {
  const clean = hash.replace(/[^0-9a-z]/gi, "").slice(0, Math.max(length, 0));
  return clean.replace(/(.{4})(?=.)/g, "$1 ");
}

/* ---------------------------------------------------------------- fields on a page */

/** What a box on a document asks for. */
export type PlacedFieldType = "signature" | "initials" | "date" | "text" | "checkbox";

export const PLACED_FIELD_TYPES: ReadonlyArray<PlacedFieldType> = [
  "signature",
  "initials",
  "date",
  "text",
  "checkbox",
];

export interface FieldKind {
  label: string;
  icon: IconDefinition;
  /** Width as a fraction of the page's width. */
  w: number;
  /** Height as a fraction of the page's width (so a box keeps its shape on any page). */
  h: number;
}

export const FIELD_KINDS: Readonly<Record<PlacedFieldType, FieldKind>> = {
  signature: { label: "Signature", icon: Pen01Icon, w: 0.28, h: 0.08 },
  initials: { label: "Initials", icon: TextIcon, w: 0.1, h: 0.06 },
  date: { label: "Date", icon: Calendar01Icon, w: 0.16, h: 0.04 },
  text: { label: "Text", icon: TextAlignLeftIcon, w: 0.28, h: 0.04 },
  checkbox: { label: "Checkbox", icon: CheckmarkSquare01Icon, w: 0.035, h: 0.035 },
};

/** A box on a page, in fractions of the page (0 to 1) so that it follows any zoom. */
export interface PlacedField {
  id: string;
  type: PlacedFieldType;
  /** The page, from 1. */
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Who fills it. */
  participantId: string;
  required?: boolean;
  /** A name for the box: "Date of birth". */
  label?: string;
}

type Box = Pick<PlacedField, "x" | "y" | "w" | "h">;

/** The smallest a box may get, as a fraction of the page. */
export const MIN_FIELD = 0.02;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Keeps a box on its page and no smaller than `MIN_FIELD`. */
export function clampPlacedBox<T extends Box>(box: T): T {
  const w = clamp(box.w, MIN_FIELD, 1);
  const h = clamp(box.h, MIN_FIELD, 1);
  return { ...box, w, h, x: clamp(box.x, 0, 1 - w), y: clamp(box.y, 0, 1 - h) };
}

/** A box of the type, centred on a point of the page (fractions). `aspect` is height / width. */
export function boxAt(type: PlacedFieldType, cx: number, cy: number, aspect = 1.414): Box {
  const kind = FIELD_KINDS[type];
  const w = kind.w;
  const h = kind.h / aspect;
  return clampPlacedBox({ x: cx - w / 2, y: cy - h / 2, w, h });
}

/** A field moved by a step, kept on the page. */
export function nudgeField<T extends Box>(field: T, dx: number, dy: number): T {
  return clampPlacedBox({ ...field, x: field.x + dx, y: field.y + dy });
}

/** A field made bigger or smaller by a step, its corner at the top left kept. */
export function resizeField<T extends Box>(field: T, dw: number, dh: number): T {
  return clampPlacedBox({ ...field, w: field.w + dw, h: field.h + dh });
}

/** The fields on a page. */
export const fieldsOfPage = (fields: ReadonlyArray<PlacedField>, page: number): PlacedField[] =>
  fields.filter((f) => f.page === page);

/** The people who have no box of that type, to tell the sender before it goes out. */
export function participantsWithoutField(
  fields: ReadonlyArray<PlacedField>,
  participants: ReadonlyArray<ApprovalParticipant>,
  type: PlacedFieldType = "signature",
): ApprovalParticipant[] {
  return participants.filter(
    (p) => !fields.some((f) => f.participantId === p.id && f.type === type),
  );
}
