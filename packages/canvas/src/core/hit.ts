// Hit testing and the geometry of gestures: what is under a point, what a box or a lasso catches,
// which handle is under the pointer, what a resize gives.

import { containsBounds, containsPoint, intersects, center, pointInPolygon } from "./geometry";
import { snap } from "./grid";
import { isSelectable, kindOf, type KindMap, type ResizeRule } from "./kinds";
import type { Bounds, Handle, Item, Point } from "./types";

/** Items from the top of the stack down: the order a click sees them. */
export function topDown<D>(items: ReadonlyArray<Item<D>>): Item<D>[] {
  return [...items].sort((a, b) => b.z - a.z);
}

/** The top-most selectable item under a world point, asking each kind's own hit test. */
export function hitTest<D>(
  items: ReadonlyArray<Item<D>>,
  point: Point,
  kinds: KindMap<D> = {},
): Item<D> | null {
  for (const item of topDown(items)) {
    if (!isSelectable(kinds, item)) continue;
    const own = kindOf(kinds, item).hitTest;
    if (own ? own(item, point) : containsPoint(item.bounds, point)) return item;
  }
  return null;
}

export type BoxMode = "intersect" | "contain";

/** The selectable, unlocked items a box catches: touched by it (default) or wholly inside it. */
export function itemsInRect<D>(
  items: ReadonlyArray<Item<D>>,
  rect: Bounds,
  mode: BoxMode = "intersect",
  kinds: KindMap<D> = {},
): Item<D>[] {
  return items.filter(
    (item) =>
      !item.locked &&
      isSelectable(kinds, item) &&
      (mode === "contain" ? containsBounds(rect, item.bounds) : intersects(rect, item.bounds)),
  );
}

/** The selectable, unlocked items whose centre is inside a lasso. */
export function itemsInLasso<D>(
  items: ReadonlyArray<Item<D>>,
  polygon: ReadonlyArray<Point>,
  kinds: KindMap<D> = {},
): Item<D>[] {
  if (polygon.length < 3) return [];
  return items.filter(
    (item) =>
      !item.locked && isSelectable(kinds, item) && pointInPolygon(center(item.bounds), polygon),
  );
}

/** Where a handle sits on a rectangle. */
export function handlePosition(b: Bounds, handle: Handle): Point {
  const x = handle.includes("w") ? b.x : handle.includes("e") ? b.x + b.w : b.x + b.w / 2;
  const y = handle.includes("n") ? b.y : handle.includes("s") ? b.y + b.h : b.y + b.h / 2;
  return { x, y };
}

/** The handle within `tolerance` of a point, if any; corners win over edges. */
export function handleAt(
  b: Bounds,
  point: Point,
  tolerance: number,
  handles: ReadonlyArray<Handle>,
): Handle | null {
  const ordered = [...handles].sort((a, c) => c.length - a.length);
  for (const h of ordered) {
    const p = handlePosition(b, h);
    if (Math.abs(p.x - point.x) <= tolerance && Math.abs(p.y - point.y) <= tolerance) return h;
  }
  return null;
}

export interface ResizeOptions {
  rule?: ResizeRule;
  /** Keeps the ratio of the starting bounds (Shift held). */
  keepAspect?: boolean;
  /** Snaps the moving edges to this grid size; 0 for none. */
  grid?: number;
}

/**
 * The bounds after dragging `handle` by (dx, dy) world units from `start`. The opposite edge stays
 * where it is; the size is kept within the rule's limits, and on the grid when one is given.
 */
export function resizeBounds(
  start: Bounds,
  handle: Handle,
  dx: number,
  dy: number,
  options: ResizeOptions = {},
): Bounds {
  const { rule = {}, grid = 0 } = options;
  const minW = rule.minW ?? (grid || 1);
  const minH = rule.minH ?? (grid || 1);
  const maxW = rule.maxW ?? Infinity;
  const maxH = rule.maxH ?? Infinity;
  const west = handle.includes("w");
  const east = handle.includes("e");
  const north = handle.includes("n");
  const south = handle.includes("s");
  const g = (v: number) => (grid ? snap(v, grid) : v);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  let left = start.x;
  let right = start.x + start.w;
  let top = start.y;
  let bottom = start.y + start.h;
  if (west) left = right - clamp(right - g(start.x + dx), minW, maxW);
  if (east) right = left + clamp(g(start.x + start.w + dx) - left, minW, maxW);
  if (north) top = bottom - clamp(bottom - g(start.y + dy), minH, maxH);
  if (south) bottom = top + clamp(g(start.y + start.h + dy) - top, minH, maxH);

  const keep = (options.keepAspect || rule.keepAspect) && start.w > 0 && start.h > 0;
  if (keep) {
    const ratio = start.w / start.h;
    let w = right - left;
    let h = bottom - top;
    const corner = (west || east) && (north || south);
    if (corner ? w / ratio > h : west || east) h = w / ratio;
    else w = h * ratio;
    w = clamp(w, minW, maxW);
    h = clamp(h, minH, maxH);
    if (west) left = right - w;
    else if (east) right = left + w;
    else {
      left = start.x + (start.w - w) / 2;
      right = left + w;
    }
    if (north) top = bottom - h;
    else if (south) bottom = top + h;
    else {
      top = start.y + (start.h - h) / 2;
      bottom = top + h;
    }
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** Items in reading order: top to bottom, then left to right. Tab follows it. */
export function readingOrder<D>(items: ReadonlyArray<Item<D>>): Item<D>[] {
  return [...items].sort((a, b) => a.bounds.y - b.bounds.y || a.bounds.x - b.bounds.x);
}

export type Direction = "left" | "right" | "up" | "down";

/**
 * The nearest item from `from` in a direction (Alt and an arrow): its centre must lie on that
 * side; distance along the axis counts once, across it twice, so the item straight ahead wins.
 */
export function nearestInDirection<D>(
  items: ReadonlyArray<Item<D>>,
  from: Item<D>,
  direction: Direction,
): Item<D> | null {
  const o = center(from.bounds);
  let best: Item<D> | null = null;
  let bestScore = Infinity;
  for (const item of items) {
    if (item.id === from.id) continue;
    const c = center(item.bounds);
    const dx = c.x - o.x;
    const dy = c.y - o.y;
    const along =
      direction === "left" ? -dx : direction === "right" ? dx : direction === "up" ? -dy : dy;
    const across = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
    if (along <= 0) continue;
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}
