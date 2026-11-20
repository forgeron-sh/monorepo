// The pure part of the Tree primitive: given the rows that are on screen (in order, with their
// depth), where a key sends the focus, which ones a range covers, which one a typed word finds.
// No React, no DOM: tree.tsx reads the rows from the page and applies what these return.

/** One row of the tree that is shown, as the keyboard sees it. */
export interface TreeRow {
  id: string;
  /** 1 for a top-level row. */
  level: number;
  /** Has children, shown or not. */
  branch: boolean;
  expanded: boolean;
  disabled: boolean;
  /** What a typed word is matched against. */
  text: string;
}

/** The index of the row that holds row `at`: the nearest one above with a smaller level; -1 for a top-level row. */
export function treeParentIndex(rows: ReadonlyArray<TreeRow>, at: number): number {
  const level = rows[at]?.level ?? 1;
  for (let i = at - 1; i >= 0; i--) if (rows[i]!.level < level) return i;
  return -1;
}

/** Whether the row after `at` is a child of it. */
function treeHasShownChild(rows: ReadonlyArray<TreeRow>, at: number): boolean {
  const next = rows[at + 1];
  return !!next && next.level > rows[at]!.level;
}

/** The branches that share the parent of row `at`, itself included: what `*` opens. */
export function treeSiblingBranches(rows: ReadonlyArray<TreeRow>, at: number): TreeRow[] {
  const parent = treeParentIndex(rows, at);
  return rows.filter(
    (r, i) => r.branch && treeParentIndex(rows, i) === parent && r.level === rows[at]!.level,
  );
}

/** What a key does to the focus and to the open state. `focus` is a row index. */
export type TreeMove = { focus?: number; expand?: string; collapse?: string };

/**
 * The arrows, Home and End, as the WAI-ARIA tree pattern has them: Down and Up walk the rows,
 * Right opens a closed branch or steps into an open one, Left closes an open branch or climbs to
 * its parent. Null for any other key.
 */
export function treeNavigate(
  rows: ReadonlyArray<TreeRow>,
  at: number,
  key: string,
): TreeMove | null {
  const row = rows[at];
  if (!row) return null;
  const last = rows.length - 1;
  switch (key) {
    case "ArrowDown":
      return { focus: Math.min(at + 1, last) };
    case "ArrowUp":
      return { focus: Math.max(at - 1, 0) };
    case "Home":
      return { focus: 0 };
    case "End":
      return { focus: last };
    case "ArrowRight":
      if (!row.branch) return {};
      if (!row.expanded) return { expand: row.id };
      return treeHasShownChild(rows, at) ? { focus: at + 1 } : {};
    case "ArrowLeft": {
      if (row.branch && row.expanded) return { collapse: row.id };
      const parent = treeParentIndex(rows, at);
      return parent >= 0 ? { focus: parent } : {};
    }
    default:
      return null;
  }
}

/** The ids from row `a` to row `b` (either order), the disabled ones left out. */
export function treeRangeIds(rows: ReadonlyArray<TreeRow>, a: number, b: number): string[] {
  const [from, to] = a < b ? [a, b] : [b, a];
  return rows
    .slice(from, to + 1)
    .filter((r) => !r.disabled)
    .map((r) => r.id);
}

/** How long a pause ends a typed word, in milliseconds. */
export const TREE_TYPEAHEAD_MS = 500;

/**
 * The row a typed word finds: the first one after `at` (wrapping round) whose text starts with
 * `typed`. The same letter pressed again and again walks the rows that start with it. Returns the
 * row index, or -1.
 */
export function treeTypeahead(rows: ReadonlyArray<TreeRow>, at: number, typed: string): number {
  if (typed === "" || rows.length === 0) return -1;
  const word = typed.toLowerCase();
  const repeated = word.length > 1 && [...word].every((c) => c === word[0]);
  const needle = repeated ? word[0]! : word;
  // One letter, or one letter repeated: start after the focused row. A longer word may be the
  // focused row's own start, so it starts there.
  const start = needle.length === 1 ? at + 1 : at;
  for (let n = 0; n < rows.length; n++) {
    const i = (start + n) % rows.length;
    if (rows[i]!.text.toLowerCase().startsWith(needle)) return i;
  }
  return -1;
}
