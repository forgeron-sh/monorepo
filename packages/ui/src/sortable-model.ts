// The pure part of the Sortable primitive: moving an item in a list, where a drop lands from the
// pointer's place in a row, which key means which move, and the words said after a move. No
// React, no DOM: sortable.tsx reads the events and applies what these return.

export type SortableOrientation = "vertical" | "horizontal";

/** Where a drop lands relative to the row under the pointer. `inside` is for trees. */
export type SortablePosition = "before" | "inside" | "after";

/** One move of one item: its id and the indexes it left and reached. */
export interface SortableMove {
  id: string;
  from: number;
  to: number;
}

/** `to` kept inside `[min, max]`; the whole list by default. */
export function clampIndex(to: number, length: number, range?: readonly [number, number]): number {
  const min = range?.[0] ?? 0;
  const max = Math.min(range?.[1] ?? length - 1, length - 1);
  return Math.max(min, Math.min(max, to));
}

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

/** A copy of `list` with the item whose id is `id` moved to index `to` (kept in the list). */
export function moveById<T>(
  list: ReadonlyArray<T>,
  getId: (item: T) => string,
  id: string,
  to: number,
): T[] {
  const from = list.findIndex((item) => getId(item) === id);
  return moveItem(list, from, clampIndex(to, list.length));
}

/**
 * The index an item lands on when it is dropped in `slot`, a gap of the list counted before the
 * item that has that index (the last gap is the length). A card that leaves above its slot makes
 * the slot one lower.
 */
export function sortableSlotIndex(from: number, slot: number): number {
  return from >= 0 && from < slot ? slot - 1 : slot;
}

/** The range a pointer inside a row means "inside" for, as shares of the row's size. */
export type SortableNestRange = readonly [number, number];

const NEST: SortableNestRange = [0.25, 0.75];

/**
 * Where a drop lands from the pointer's place in a row: `offset` from its start, along the list's
 * axis, in a row of `size`. Without `nest` the middle splits the row in two, before and after; with
 * it the middle part is "inside" (a row that can hold others), a quarter at each end otherwise.
 */
export function sortableDropPosition(
  offset: number,
  size: number,
  nest: boolean | SortableNestRange = false,
): SortablePosition {
  if (!(size > 0)) return nest ? "inside" : "after";
  const ratio = offset / size;
  if (!nest) return ratio < 0.5 ? "before" : "after";
  const [start, end] = nest === true ? NEST : nest;
  return ratio < start ? "before" : ratio > end ? "after" : "inside";
}

/** What a key asks of the focused item: one step either way, or the first or last place. */
export type SortableStep = { delta: -1 | 1 } | { edge: "first" | "last" };

/**
 * The step a key means along the list's axis: Up and Down in a column, Left and Right in a row;
 * with `edges`, Home and End. Null for any other key.
 */
export function sortableKeyStep(
  key: string,
  orientation: SortableOrientation = "vertical",
  edges = false,
): SortableStep | null {
  const [back, forward] =
    orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
  if (key === back) return { delta: -1 };
  if (key === forward) return { delta: 1 };
  if (edges && key === "Home") return { edge: "first" };
  if (edges && key === "End") return { edge: "last" };
  return null;
}

/** The index a step leads to from `at`, in a list of `length`; not kept inside it. */
export function sortableStepTarget(step: SortableStep, at: number, length: number): number {
  if ("edge" in step) return step.edge === "first" ? 0 : length - 1;
  return at + step.delta;
}

/** "Moved Status to position 3 of 5": what a move is said as. */
export function sortableMoveText(name: string, position: number, count: number): string {
  return `Moved ${name} to position ${position} of ${count}`;
}

/** The text for a move, from the item's name and the move's target (a 0-based index). */
export function sortableAnnouncement(name: string, move: SortableMove, count: number): string {
  return sortableMoveText(name, move.to + 1, count);
}
