// Align and distribute, core half: lines a selection up on an edge or a centre of the box around
// it, spaces it evenly. Each function returns the changes, for `store.updateMany(changes, { label })`:
// one undo step, and the draw engine moves the frames' items and the bound arrows along with them.

import { unionBounds } from "@forgeron/canvas";
import { definePlugin, type Changes } from "../core/plugin";
import type { DrawItem } from "../core/types";

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

export const alignPlugin = definePlugin({
  id: "align",
  name: "Align and distribute",
  description: "Lines a selection up on an edge or a centre and spaces it evenly.",
});
