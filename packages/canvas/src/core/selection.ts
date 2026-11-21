// The selection: a set of item ids, changed by pure operations. A click replaces it, Shift or
// Command toggles one item, Shift plus a box adds to it.

export type Selection = ReadonlySet<string>;

export type SelectMode = "replace" | "add" | "toggle" | "remove";

export const EMPTY_SELECTION: Selection = new Set();

export function applySelection(
  current: Selection,
  ids: Iterable<string>,
  mode: SelectMode = "replace",
): Selection {
  const list = [...ids];
  if (mode === "replace") return new Set(list);
  const next = new Set(current);
  for (const id of list) {
    if (mode === "add") next.add(id);
    else if (mode === "remove") next.delete(id);
    else if (next.has(id)) next.delete(id);
    else next.add(id);
  }
  return next;
}

/** Whether two selections hold the same ids. */
export function sameSelection(a: Selection, b: Selection): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

/** Keeps only the ids that still exist. */
export function pruneSelection(current: Selection, exists: (id: string) => boolean): Selection {
  const next = [...current].filter(exists);
  return next.length === current.size ? current : new Set(next);
}
