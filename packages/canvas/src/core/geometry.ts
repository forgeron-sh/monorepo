// Rectangles and polygons in world units: the arithmetic behind hit testing, selection and fitting.

import type { Bounds, Point } from "./types";

/** A rectangle from two corners in any order. */
export function rectFromPoints(a: Point, b: Point): Bounds {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x),
    h: Math.abs(b.y - a.y),
  };
}

/** The same rectangle with a non-negative size. */
export function normalizeBounds(b: Bounds): Bounds {
  return rectFromPoints({ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y + b.h });
}

export function containsPoint(b: Bounds, p: Point): boolean {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

/** Whether two rectangles overlap; touching edges count. */
export function intersects(a: Bounds, b: Bounds): boolean {
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

/** Whether `inner` lies wholly inside `outer`. */
export function containsBounds(outer: Bounds, inner: Bounds): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

/** The smallest rectangle around all of them, or null when there are none. */
export function unionBounds(list: Iterable<Bounds>): Bounds | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of list) {
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function inflate(b: Bounds, by: number): Bounds {
  return { x: b.x - by, y: b.y - by, w: b.w + by * 2, h: b.h + by * 2 };
}

export function center(b: Bounds): Point {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

/** Even-odd rule: whether a point is inside a closed polygon (a lasso). */
export function pointInPolygon(p: Point, polygon: ReadonlyArray<Point>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}
