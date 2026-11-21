// Undo and redo as patches: an entry is the list of changes one action made, each with what it
// replaced, so undoing applies the inverse. A drag commits one entry when it ends; repeated
// nudges of the same selection merge into the entry before them.

import type { Item, ItemChange } from "./types";

export type Patch<D = unknown> =
  | { op: "add"; item: Item<D> }
  | { op: "remove"; item: Item<D> }
  | { op: "update"; id: string; before: ItemChange<D>; after: ItemChange<D> };

export interface HistoryEntry<D = unknown> {
  patches: ReadonlyArray<Patch<D>>;
  /** What the person did, for a menu ("Undo move"). */
  label?: string;
  /** Entries with the same key in a row merge into one (nudges of one selection). */
  coalesce?: string;
}

export interface History<D = unknown> {
  past: ReadonlyArray<HistoryEntry<D>>;
  future: ReadonlyArray<HistoryEntry<D>>;
  limit: number;
}

export function createHistory<D>(limit = 200): History<D> {
  return { past: [], future: [], limit };
}

export function invertPatch<D>(p: Patch<D>): Patch<D> {
  if (p.op === "add") return { op: "remove", item: p.item };
  if (p.op === "remove") return { op: "add", item: p.item };
  return { op: "update", id: p.id, before: p.after, after: p.before };
}

/** The patches that undo `patches`: each one inverted, in reverse order. */
export function invertPatches<D>(patches: ReadonlyArray<Patch<D>>): Patch<D>[] {
  return [...patches].reverse().map(invertPatch);
}

/** Items after the patches. Order of the list is kept; an added item goes at the end. */
export function applyPatches<D>(
  items: ReadonlyArray<Item<D>>,
  patches: ReadonlyArray<Patch<D>>,
): Item<D>[] {
  let next = [...items];
  for (const p of patches) {
    if (p.op === "add") next = [...next.filter((i) => i.id !== p.item.id), p.item];
    else if (p.op === "remove") next = next.filter((i) => i.id !== p.item.id);
    else next = next.map((i) => (i.id === p.id ? { ...i, ...p.after } : i));
  }
  return next;
}

/** The fields of `item` that `change` touches, as they are now: the `before` of an update. */
export function pick<D>(item: Item<D>, change: ItemChange<D>): ItemChange<D> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(change))
    out[key] = (item as unknown as Record<string, unknown>)[key];
  return out as ItemChange<D>;
}

/** Merges two lists of patches made one after the other into the shortest equivalent list. */
export function mergePatches<D>(
  first: ReadonlyArray<Patch<D>>,
  then: ReadonlyArray<Patch<D>>,
): Patch<D>[] {
  const out = [...first];
  for (const p of then) {
    if (p.op === "update") {
      const i = out.findIndex((q) => q.op === "update" && q.id === p.id);
      const q = out[i];
      if (q && q.op === "update") {
        out[i] = {
          op: "update",
          id: p.id,
          before: { ...p.before, ...q.before },
          after: { ...q.after, ...p.after },
        };
        continue;
      }
    }
    out.push(p);
  }
  return out;
}

/** Records an entry: clears the redo list, merges with the last entry when both carry the same key. */
export function record<D>(history: History<D>, entry: HistoryEntry<D>): History<D> {
  if (entry.patches.length === 0) return history;
  const last = history.past.at(-1);
  if (last && entry.coalesce && last.coalesce === entry.coalesce) {
    const merged = { ...last, patches: mergePatches(last.patches, entry.patches) };
    return { ...history, past: [...history.past.slice(0, -1), merged], future: [] };
  }
  const past = [...history.past, entry].slice(-history.limit);
  return { ...history, past, future: [] };
}

/** Ends merging: the next entry with the same key starts a new one. */
export function seal<D>(history: History<D>): History<D> {
  const last = history.past.at(-1);
  if (!last?.coalesce) return history;
  const { coalesce: _sealed, ...rest } = last;
  return { ...history, past: [...history.past.slice(0, -1), rest] };
}

export interface Step<D> {
  history: History<D>;
  /** The patches to apply to the document, or null when there is nothing to undo or redo. */
  patches: Patch<D>[] | null;
  entry: HistoryEntry<D> | null;
}

export function undo<D>(history: History<D>): Step<D> {
  const entry = history.past.at(-1);
  if (!entry) return { history, patches: null, entry: null };
  return {
    history: { ...history, past: history.past.slice(0, -1), future: [...history.future, entry] },
    patches: invertPatches(entry.patches),
    entry,
  };
}

export function redo<D>(history: History<D>): Step<D> {
  const entry = history.future.at(-1);
  if (!entry) return { history, patches: null, entry: null };
  return {
    history: { ...history, future: history.future.slice(0, -1), past: [...history.past, entry] },
    patches: [...entry.patches],
    entry,
  };
}

/** The ids an entry touches: what is selected after undoing or redoing it. */
export function touchedIds<D>(patches: ReadonlyArray<Patch<D>>): string[] {
  return [...new Set(patches.map((p) => (p.op === "update" ? p.id : p.item.id)))];
}
