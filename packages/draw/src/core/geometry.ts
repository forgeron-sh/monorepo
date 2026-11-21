// Small geometry for the kinds: distances to segments, the outline of a rectangle, an ellipse and
// a diamond, and where a ray from the centre leaves each of them (where a bound arrow lands).

import type { Bounds, Point } from "@forgeron/canvas";
import type { DrawItem } from "./types";

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function distanceToPolyline(p: Point, points: ReadonlyArray<Point>): number {
  if (points.length === 1) return Math.hypot(p.x - points[0]!.x, p.y - points[0]!.y);
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    best = Math.min(best, distanceToSegment(p, points[i - 1]!, points[i]!));
  }
  return best;
}

export const centerOf = (b: Bounds): Point => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function insideEllipse(b: Bounds, p: Point): boolean {
  const rx = b.w / 2;
  const ry = b.h / 2;
  if (rx <= 0 || ry <= 0) return false;
  return ((p.x - b.x - rx) / rx) ** 2 + ((p.y - b.y - ry) / ry) ** 2 <= 1;
}

export function insideDiamond(b: Bounds, p: Point): boolean {
  const rx = b.w / 2;
  const ry = b.h / 2;
  if (rx <= 0 || ry <= 0) return false;
  return Math.abs(p.x - b.x - rx) / rx + Math.abs(p.y - b.y - ry) / ry <= 1;
}

/** The four corners of a diamond, top first, clockwise. */
export const diamondPoints = (b: Bounds): Point[] => [
  { x: b.x + b.w / 2, y: b.y },
  { x: b.x + b.w, y: b.y + b.h / 2 },
  { x: b.x + b.w / 2, y: b.y + b.h },
  { x: b.x, y: b.y + b.h / 2 },
];

/** The outline an arrow lands on: what each kind looks like from outside. */
export type Outline = "rect" | "ellipse" | "diamond";

export const outlineOf = (item: DrawItem): Outline =>
  item.kind === "ellipse" ? "ellipse" : item.kind === "diamond" ? "diamond" : "rect";

/**
 * Where the ray from the centre of `b` towards `toward` crosses the outline, pushed out by `gap`.
 * The centre itself when `toward` is the centre.
 */
export function outlinePoint(b: Bounds, outline: Outline, toward: Point, gap = 0): Point {
  const c = centerOf(b);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return c;
  const ux = dx / len;
  const uy = dy / len;
  const rx = b.w / 2;
  const ry = b.h / 2;
  let t: number;
  if (outline === "ellipse") {
    t = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
  } else if (outline === "diamond") {
    t = 1 / (Math.abs(ux) / rx + Math.abs(uy) / ry);
  } else {
    const tx = ux === 0 ? Infinity : rx / Math.abs(ux);
    const ty = uy === 0 ? Infinity : ry / Math.abs(uy);
    t = Math.min(tx, ty);
  }
  if (!Number.isFinite(t)) t = 0;
  return { x: c.x + ux * (t + gap), y: c.y + uy * (t + gap) };
}

export function boundsOfPoints(points: ReadonlyArray<Point>): Bounds {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const containsCenter = (outer: Bounds, inner: Bounds) => {
  const c = centerOf(inner);
  return c.x >= outer.x && c.x <= outer.x + outer.w && c.y >= outer.y && c.y <= outer.y + outer.h;
};
