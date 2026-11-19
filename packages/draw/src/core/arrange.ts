// Arranging a selection: align, distribute, group and ungroup, lock and unlock. Each function
// returns the changes, for `store.updateMany(changes, { label })`: one undo step, and the draw
// engine moves the frames' items and the bound arrows along with them.

import { unionBounds, type ItemChange } from "@forgeron/canvas";
import type { DrawData, DrawItem } from "./types";

type Changes = Array<readonly [string, ItemChange<DrawData>]>;

export type AlignEdge = "left" | "center" | "right" | "top" | "middle" | "bottom";

/** Items that move when the selection is arranged: unlocked, and not an arrow (it follows). */
const movable = (items: ReadonlyArray<DrawItem>) =>
  items.filter((i) => !i.locked && i.data.type !== "arrow");

/** Lines the items up on an edge or a centre of the box around them. */
export function align(items: ReadonlyArray<DrawItem>, edge: AlignEdge): Changes {
  const list = movable(items);
  const box = unionBounds(list.map((i) => i.bounds));
  if (!box || list.length < 2) return [];
  const out: Changes = [];
  for (const i of list) {
    const b = i.bounds;
    let { x, y } = b;
    if (edge === "left") x = box.x;
    else if (edge === "right") x = box.x + box.w - b.w;
    else if (edge === "center") x = Math.round(box.x + (box.w - b.w) / 2);
    else if (edge === "top") y = box.y;
    else if (edge === "bottom") y = box.y + box.h - b.h;
    else y = Math.round(box.y + (box.h - b.h) / 2);
    if (x !== b.x || y !== b.y) out.push([i.id, { bounds: { ...b, x, y } }]);
  }
  return out;
}

/** Spaces the items evenly between the first and the last, across or down. */
export function distribute(
  items: ReadonlyArray<DrawItem>,
  axis: "horizontal" | "vertical",
): Changes {
  const list = movable(items);
  if (list.length < 3) return [];
  const h = axis === "horizontal";
  const pos = (i: DrawItem) => (h ? i.bounds.x : i.bounds.y);
  const size = (i: DrawItem) => (h ? i.bounds.w : i.bounds.h);
  const sorted = [...list].sort((a, b) => pos(a) - pos(b) || a.id.localeCompare(b.id));
  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  const span = pos(last) + size(last) - pos(first);
  const used = sorted.reduce((sum, i) => sum + size(i), 0);
  const gap = (span - used) / (sorted.length - 1);
  const out: Changes = [];
  let at = pos(first);
  for (const i of sorted) {
    const next = Math.round(at);
    if (next !== pos(i)) {
      out.push([i.id, { bounds: { ...i.bounds, ...(h ? { x: next } : { y: next }) } }]);
    }
    at += size(i) + gap;
  }
  return out;
}

const withGroup = (data: DrawData, group: string | undefined): DrawData => {
  const { group: _old, ...rest } = data;
  return (group ? { ...rest, group } : rest) as DrawData;
};

/** Puts the items in one group: selecting one selects them all. */
export function group(items: ReadonlyArray<DrawItem>, groupId: string): Changes {
  if (items.length < 2) return [];
  return items.map((i) => [i.id, { data: withGroup(i.data, groupId) }] as const);
}

/** Takes the items out of their group. */
export function ungroup(items: ReadonlyArray<DrawItem>): Changes {
  return items
    .filter((i) => i.data.group)
    .map((i) => [i.id, { data: withGroup(i.data, undefined) }] as const);
}

/** A group id no item uses yet: `group-<n>`. */
export function newGroupId(items: ReadonlyArray<DrawItem>): string {
  const used = new Set(items.map((i) => i.data.group).filter(Boolean));
  let n = 1;
  while (used.has(`group-${n}`)) n++;
  return `group-${n}`;
}

/** Locks every item, or unlocks them all when every one is locked already. */
export function toggleLock(items: ReadonlyArray<DrawItem>): Changes {
  const lock = !items.every((i) => i.locked);
  return items.filter((i) => !!i.locked !== lock).map((i) => [i.id, { locked: lock }] as const);
}

/** The ids of the items that share a group with any of `ids`, `ids` included. */
export function expandGroups(items: ReadonlyArray<DrawItem>, ids: Iterable<string>): string[] {
  const wanted = new Set(ids);
  const groups = new Set<string>();
  for (const i of items) if (wanted.has(i.id) && i.data.group) groups.add(i.data.group);
  if (groups.size === 0) return [...wanted];
  for (const i of items) if (i.data.group && groups.has(i.data.group)) wanted.add(i.id);
  return [...wanted];
}
