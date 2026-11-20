// The arithmetic of a selectable collection (use-collection.ts), without React: what a click or a
// key leaves selected, where an arrow goes, which item a typed word finds. Usable in a test or on a
// server.

export type CollectionOrientation = "vertical" | "horizontal" | "grid";

/**
 * The selection after a click on `id`, as in a file manager: a plain click selects it alone, ⌘ or
 * Ctrl adds or removes it, ⇧ selects the run from the anchor (added to the rest with ⌘ too).
 */
export function selectionAfterClick(
  selected: ReadonlyArray<string>,
  order: ReadonlyArray<string>,
  id: string,
  { shift = false, mod = false }: { shift?: boolean; mod?: boolean },
  anchor: string | null,
): string[] {
  if (shift && anchor !== null && order.includes(anchor)) {
    const a = order.indexOf(anchor);
    const b = order.indexOf(id);
    const run = order.slice(Math.min(a, b), Math.max(a, b) + 1);
    const base = mod ? selected.filter((x) => !run.includes(x)) : [];
    return [...base, ...run];
  }
  if (mod) return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
  return [id];
}

export interface CollectionMoveOptions {
  orientation: CollectionOrientation;
  /** Items per row of a grid; without it a grid asks `rowStep` (the page's own layout). */
  columns?: number | undefined;
  /** Letter keys that move like arrows, in a vertical list: `j` down, `k` up. */
  vimKeys?: boolean;
  /** The index one row down (`1`) or up (`-1`) of a grid whose columns are not known. */
  rowStep?: ((at: number, direction: 1 | -1) => number) | undefined;
}

/**
 * Where a key moves the focus from the item `at` of `count` (`at` is -1 with nothing focused):
 * an index, clamped to the list, or `null` for a key that does not move. Home and End are the ends.
 */
export function collectionMove(
  key: string,
  at: number,
  count: number,
  { orientation, columns, vimKeys = false, rowStep }: CollectionMoveOptions,
): number | null {
  if (count === 0) return null;
  const clamp = (to: number) => Math.min(Math.max(to, 0), count - 1);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const down = key === "ArrowDown" || (vimKeys && orientation === "vertical" && key === "j");
  const up = key === "ArrowUp" || (vimKeys && orientation === "vertical" && key === "k");
  const next = key === "ArrowRight";
  const prev = key === "ArrowLeft";
  const moves =
    orientation === "vertical"
      ? down || up
      : orientation === "horizontal"
        ? next || prev
        : down || up || next || prev;
  if (!moves) return null;
  // Nothing focused yet: any move lands on the first item.
  if (at < 0) return 0;
  if (orientation === "vertical") return clamp(at + (down ? 1 : -1));
  if (orientation === "horizontal") return clamp(at + (next ? 1 : -1));
  if (next) return clamp(at + 1);
  if (prev) return clamp(at - 1);
  const dir = down ? 1 : -1;
  if (columns && columns > 0) {
    const to = at + dir * columns;
    // On the first or last row there is no row to go to: stay.
    return to < 0 || to > count - 1 ? at : to;
  }
  return clamp(rowStep ? rowStep(at, dir) : at + dir);
}

/** How long a typed word is kept, in ms: after it the next letter starts a new word. */
export const COLLECTION_TYPEAHEAD_MS = 500;

/**
 * The index of the item whose text starts with what was typed, or -1. One letter (or one letter
 * repeated) starts after the focused item and wraps; a longer word may be the focused item's own.
 */
export function collectionTypeahead(
  texts: ReadonlyArray<string>,
  at: number,
  typed: string,
): number {
  if (typed === "" || texts.length === 0) return -1;
  const word = typed.toLowerCase();
  const repeated = word.length > 1 && [...word].every((c) => c === word[0]);
  const needle = repeated ? word[0]! : word;
  const start = needle.length === 1 ? at + 1 : Math.max(at, 0);
  for (let n = 0; n < texts.length; n++) {
    const i = (start + n) % texts.length;
    if (texts[i]!.toLowerCase().startsWith(needle)) return i;
  }
  return -1;
}
