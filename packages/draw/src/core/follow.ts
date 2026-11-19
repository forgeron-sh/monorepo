// What follows a change of the board, as plain functions of the items before and after it:
// the items of a frame that moved move with it, bound arrows go back onto their items, and an
// arrow dragged away from an item it was bound to lets go of it. The draw engine (`engine.ts`)
// applies them in the same undo step as the change.

import type { ItemChange } from "@forgeron/canvas";
import { layoutArrow, sameGeometry } from "./arrows";
import { isArrow, isFrame, type ArrowData, type DrawData, type DrawItem } from "./types";

type Changes = Array<readonly [string, ItemChange<DrawData>]>;

/** The ids whose item is not the same object before and after, removed ones included. */
export function changedIds(
  before: ReadonlyMap<string, DrawItem>,
  after: ReadonlyArray<DrawItem>,
): Set<string> {
  const out = new Set<string>();
  const seen = new Set<string>();
  for (const item of after) {
    seen.add(item.id);
    if (before.get(item.id) !== item) out.add(item.id);
  }
  for (const id of before.keys()) if (!seen.has(id)) out.add(id);
  return out;
}

const translated = (was: DrawItem, now: DrawItem) =>
  was.data === now.data &&
  was.bounds.w === now.bounds.w &&
  was.bounds.h === now.bounds.h &&
  (was.bounds.x !== now.bounds.x || was.bounds.y !== now.bounds.y);

/** A frame that moved takes along its items that did not move themselves. */
export function frameFollow(
  before: ReadonlyMap<string, DrawItem>,
  after: ReadonlyArray<DrawItem>,
  changed: ReadonlySet<string>,
): Changes {
  const moves = new Map<string, { dx: number; dy: number }>();
  for (const item of after) {
    if (!changed.has(item.id) || !isFrame(item)) continue;
    const was = before.get(item.id);
    if (was && translated(was, item)) {
      moves.set(item.id, { dx: item.bounds.x - was.bounds.x, dy: item.bounds.y - was.bounds.y });
    }
  }
  if (moves.size === 0) return [];
  const out: Changes = [];
  for (const item of after) {
    const frame = item.data.type === "frame" ? undefined : item.data.frame;
    const d = frame ? moves.get(frame) : undefined;
    if (!d || changed.has(item.id) || item.locked) continue;
    const b = item.bounds;
    out.push([item.id, { bounds: { ...b, x: b.x + d.dx, y: b.y + d.dy } }]);
  }
  return out;
}

/**
 * Arrows put back on their items: those bound to an item that changed (or is gone), and those
 * that changed themselves. An arrow moved on its own lets go of the ends whose item stayed.
 */
export function arrowFollow(
  before: ReadonlyMap<string, DrawItem>,
  after: ReadonlyArray<DrawItem>,
  changed: ReadonlySet<string>,
): Changes {
  const byId = new Map(after.map((i) => [i.id, i]));
  const get = (id: string) => byId.get(id);
  const out: Changes = [];
  for (const item of after) {
    if (!isArrow(item)) continue;
    const { start, end } = item.data;
    const self = changed.has(item.id);
    const touched =
      self ||
      (start.bind !== undefined && changed.has(start.bind)) ||
      (end.bind !== undefined && changed.has(end.bind));
    if (!touched) continue;
    let arrow: DrawItem<ArrowData> = item;
    const was = before.get(item.id);
    if (self && was && translated(was, item)) {
      // Dragged: an end whose item did not move with it is let go where it is.
      const keep = (bind: string | undefined) => (bind && changed.has(bind) ? bind : undefined);
      const s = keep(start.bind);
      const e = keep(end.bind);
      if (s !== start.bind || e !== end.bind) {
        const { bind: _s, ...sRest } = start;
        const { bind: _e, ...eRest } = end;
        arrow = {
          ...item,
          data: {
            ...item.data,
            start: s ? { ...sRest, bind: s } : sRest,
            end: e ? { ...eRest, bind: e } : eRest,
          },
        };
      }
    }
    const g = layoutArrow(arrow, get);
    if (!sameGeometry(g, item)) out.push([item.id, { bounds: g.bounds, data: g.data }]);
  }
  return out;
}
