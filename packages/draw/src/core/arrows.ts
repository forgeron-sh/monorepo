// Lines and arrows: two ends, each a free point or bound to an item, drawn straight or as an
// elbow. A bound end lands on the outline of its item, on the line towards the other end; when
// the item moves, `layoutArrow` puts the arrow back on it (the draw engine calls it, see
// `follow.ts`). The item's bounds wrap the route with room for the heads, its ends are local.

import type { Bounds, Point } from "@forgeron/canvas";
import { boundsOfPoints, centerOf, distanceToPolyline, outlineOf, outlinePoint } from "./geometry";
import type { ArrowData, ArrowEnd, ArrowRoute, DrawItem } from "./types";

/** World units around the route inside the bounds: the heads and the hit reach. */
export const ARROW_PAD = 10;
/** World units between a bound end and its item's outline. */
export const ARROW_GAP = 4;

export type Lookup = (id: string) => DrawItem | undefined;

const world = (b: Bounds, e: ArrowEnd): Point => ({ x: b.x + e.x, y: b.y + e.y });

/** The ends in world units, as stored. */
export function arrowEnds(item: DrawItem<ArrowData>): { start: Point; end: Point } {
  return { start: world(item.bounds, item.data.start), end: world(item.bounds, item.data.end) };
}

/** The route between two world points: two points straight, four for an elbow. */
export function routeBetween(start: Point, end: Point, route: ArrowRoute): Point[] {
  if (route === "straight") return [start, end];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const mx = Math.round(start.x + dx / 2);
    return [start, { x: mx, y: start.y }, { x: mx, y: end.y }, end];
  }
  const my = Math.round(start.y + dy / 2);
  return [start, { x: start.x, y: my }, { x: end.x, y: my }, end];
}

/** The route of an arrow item in world units. */
export function arrowRoute(item: DrawItem<ArrowData>): Point[] {
  const { start, end } = arrowEnds(item);
  return routeBetween(start, end, item.data.route);
}

/** The bindable target: an item that is neither an arrow nor a frame. */
export const canBind = (item: DrawItem | undefined): item is DrawItem =>
  !!item && item.data.type !== "arrow" && item.data.type !== "frame";

/** Where a bound end lands: on the target's outline, facing the other end. */
function landing(target: DrawItem, other: Point, route: ArrowRoute): Point {
  const c = centerOf(target.bounds);
  let toward = other;
  if (route === "elbow") {
    // An elbow leaves from the middle of a side, the one facing the other end.
    const dx = other.x - c.x;
    const dy = other.y - c.y;
    toward =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: c.x + Math.sign(dx || 1), y: c.y }
        : { x: c.x, y: c.y + Math.sign(dy || 1) };
  }
  return outlinePoint(target.bounds, outlineOf(target), toward, ARROW_GAP);
}

export interface ArrowGeometry {
  bounds: Bounds;
  data: ArrowData;
}

/**
 * Bounds and data of an arrow from its ends in world units: each bound end placed on its target
 * (or unbound when the target is gone), the bounds wrapping the route.
 */
export function layoutArrowFrom(
  data: ArrowData,
  start: Point,
  end: Point,
  get: Lookup,
): ArrowGeometry {
  const sTarget = data.start.bind ? get(data.start.bind) : undefined;
  const eTarget = data.end.bind ? get(data.end.bind) : undefined;
  const sBound = canBind(sTarget) ? sTarget : undefined;
  const eBound = canBind(eTarget) ? eTarget : undefined;
  // Each end faces the other's centre when it is bound, its point otherwise.
  const sRef = sBound ? centerOf(sBound.bounds) : start;
  const eRef = eBound ? centerOf(eBound.bounds) : end;
  const s = sBound ? landing(sBound, eRef, data.route) : start;
  const e = eBound ? landing(eBound, sRef, data.route) : end;
  const route = routeBetween(s, e, data.route);
  const box = boundsOfPoints(route);
  const bounds = {
    x: box.x - ARROW_PAD,
    y: box.y - ARROW_PAD,
    w: box.w + ARROW_PAD * 2,
    h: box.h + ARROW_PAD * 2,
  };
  const end_ = (p: Point, bind: string | undefined): ArrowEnd => ({
    x: p.x - bounds.x,
    y: p.y - bounds.y,
    ...(bind ? { bind } : {}),
  });
  return {
    bounds,
    data: {
      ...data,
      start: end_(s, sBound?.id),
      end: end_(e, eBound?.id),
    },
  };
}

/** The arrow placed again on its bound items. */
export function layoutArrow(item: DrawItem<ArrowData>, get: Lookup): ArrowGeometry {
  const { start, end } = arrowEnds(item);
  return layoutArrowFrom(item.data, start, end, get);
}

/** Whether a world point touches the route of an arrow. */
export function arrowHit(item: DrawItem<ArrowData>, point: Point, reach = 6): boolean {
  const width = item.data.stroke.width;
  return distanceToPolyline(point, arrowRoute(item)) <= Math.max(reach, width / 2 + 3);
}

/** Whether two geometries are the same, to skip an update that changes nothing. */
export function sameGeometry(a: ArrowGeometry, item: DrawItem<ArrowData>): boolean {
  const b = item.bounds;
  const d = item.data;
  return (
    a.bounds.x === b.x &&
    a.bounds.y === b.y &&
    a.bounds.w === b.w &&
    a.bounds.h === b.h &&
    a.data.start.x === d.start.x &&
    a.data.start.y === d.start.y &&
    a.data.start.bind === d.start.bind &&
    a.data.end.x === d.end.x &&
    a.data.end.y === d.end.y &&
    a.data.end.bind === d.end.bind
  );
}

/** The arrowhead at the end of a segment: a filled triangle's three points. */
export function arrowHead(from: Point, tip: Point, size: number): [Point, Point, Point] {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const back = { x: tip.x - ux * size, y: tip.y - uy * size };
  const half = size * 0.55;
  return [
    tip,
    { x: back.x - uy * half, y: back.y + ux * half },
    { x: back.x + uy * half, y: back.y - ux * half },
  ];
}
