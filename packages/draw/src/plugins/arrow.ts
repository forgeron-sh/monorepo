// Arrows and lines, core half: two ends, each a free point or bound to an item, drawn straight or
// as an elbow. A bound end lands on the outline of its item, on the line towards the other end;
// when the item moves, `layoutArrow` puts the arrow back on it (the `follow` rule this plugin adds
// to the draw engine). A copy of an arrow and its items is bound to the copies (`copy`). The
// item's bounds wrap the route with room for the heads, its ends are local.

import type { Bounds, NewItem, Point } from "@forgeron/canvas";
import {
  boundsOfPoints,
  centerOf,
  distanceToPolyline,
  outlineOf,
  outlinePoint,
} from "../core/geometry";
import { dashLengths } from "../core/gpu";
import { colorCss } from "../core/palette";
import { definePlugin, type Changes, type KindSpec } from "../core/plugin";
import { num, isObject, readCommon, readStroke, DrawFormatError, type Raw } from "../core/parse";
import { DEFAULT_STROKE } from "../core/style";
import { dashArray, n, type SvgNode } from "../core/svg";
import type { FarPrimitive } from "@forgeron/canvas";
import type {
  ArrowData,
  ArrowEnd,
  ArrowHead as ArrowHeadMode,
  ArrowRoute,
  DrawData,
  DrawItem,
  DrawStroke,
} from "../core/types";

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
function sameGeometry(a: ArrowGeometry, item: DrawItem<ArrowData>): boolean {
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

/* ================================================================== Constructor */

export function arrowItem(
  start: Point,
  end: Point,
  get: Lookup,
  options: {
    startBind?: string;
    endBind?: string;
    head?: ArrowHeadMode;
    route?: ArrowRoute;
    stroke?: DrawStroke;
  } = {},
): NewItem<DrawData> {
  const data: ArrowData = {
    type: "arrow",
    start: { x: 0, y: 0, ...(options.startBind ? { bind: options.startBind } : {}) },
    end: { x: 0, y: 0, ...(options.endBind ? { bind: options.endBind } : {}) },
    head: options.head ?? "end",
    route: options.route ?? "straight",
    stroke: options.stroke ?? DEFAULT_STROKE,
  };
  const g = layoutArrowFrom(data, start, end, get);
  return { kind: "arrow", bounds: g.bounds, data: g.data };
}

/* ================================================================== Following */

const translated = (was: DrawItem, now: DrawItem) =>
  was.data === now.data &&
  was.bounds.w === now.bounds.w &&
  was.bounds.h === now.bounds.h &&
  (was.bounds.x !== now.bounds.x || was.bounds.y !== now.bounds.y);

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
    if (item.data.type !== "arrow") continue;
    const current = item as DrawItem<ArrowData>;
    const { start, end } = current.data;
    const self = changed.has(item.id);
    const touched =
      self ||
      (start.bind !== undefined && changed.has(start.bind)) ||
      (end.bind !== undefined && changed.has(end.bind));
    if (!touched) continue;
    let arrow: DrawItem<ArrowData> = current;
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
          ...current,
          data: {
            ...current.data,
            start: s ? { ...sRest, bind: s } : sRest,
            end: e ? { ...eRest, bind: e } : eRest,
          },
        };
      }
    }
    const g = layoutArrow(arrow, get);
    if (!sameGeometry(g, current)) out.push([item.id, { bounds: g.bounds, data: g.data }]);
  }
  return out;
}

/* ================================================================== The kind */

const readEnd = (v: unknown, at: string): ArrowEnd => {
  if (!isObject(v)) throw new DrawFormatError(`${at} must be a point.`);
  const end: ArrowEnd = { x: num(v.x, 0), y: num(v.y, 0) };
  if (typeof v.bind === "string" && v.bind) end.bind = v.bind;
  return end;
};

const arrowKind: KindSpec = {
  type: "arrow",
  label: "Arrow",
  // An arrow is shaped by its ends, never by a box.
  canvas: { resize: false, hitTest: (i, p) => arrowHit(i as DrawItem<ArrowData>, p) },
  parse: (raw: Raw, at) => ({
    type: "arrow",
    start: readEnd(raw.start, `${at}.data.start`),
    end: readEnd(raw.end, `${at}.data.end`),
    head: raw.head === "none" || raw.head === "both" ? raw.head : "end",
    route: raw.route === "elbow" ? "elbow" : "straight",
    stroke: readStroke(raw.stroke),
    ...readCommon(raw),
  }),
  paint(item, o) {
    const d = item.data as ArrowData;
    const route = arrowRoute(item as DrawItem<ArrowData>);
    const color = o.color(d.stroke.color ?? "ink");
    const w = Math.max(1, d.stroke.width);
    const dash = dashArray(d.stroke.dash, w);
    const out: SvgNode[] = [
      n("polyline", {
        points: route.map((p) => `${p.x},${p.y}`).join(" "),
        fill: "none",
        stroke: color,
        strokeWidth: w,
        strokeLinejoin: "miter",
        ...(dash ? { strokeDasharray: dash } : {}),
      }),
    ];
    const size = 6 + w * 2;
    const head = (from: Point, tip: Point) =>
      n("polygon", {
        points: arrowHead(from, tip, size)
          .map((p) => `${p.x},${p.y}`)
          .join(" "),
        fill: color,
      });
    if (d.head !== "none" && route.length > 1) out.push(head(route.at(-2)!, route.at(-1)!));
    if (d.head === "both" && route.length > 1) out.push(head(route[1]!, route[0]!));
    return out;
  },
  far(item, frame) {
    const d = item.data as ArrowData;
    const clip = frame ? { clip: frame } : {};
    const route = arrowRoute(item as DrawItem<ArrowData>);
    const color = colorCss(d.stroke.color ?? "ink");
    const w = Math.max(1, d.stroke.width);
    const out: FarPrimitive[] = [
      { type: "line", points: route.flatMap((p) => [p.x, p.y]), color, width: w, ...clip },
    ];
    const size = 6 + w * 2;
    const head = (from: Point, tip: Point) => {
      const [a, b2, c] = arrowHead(from, tip, size);
      out.push({
        type: "triangle",
        points: [a.x, a.y, b2.x, b2.y, c.x, c.y],
        fill: color,
        ...clip,
      });
    };
    if (d.head !== "none" && route.length > 1) head(route.at(-2)!, route.at(-1)!);
    if (d.head === "both" && route.length > 1) head(route[1]!, route[0]!);
    return out;
  },
  gpu: gpuArrow,
};

/** The arrow on the GPU: its route, butt-ended and dashed as `paint` strokes it, and its heads. */
function gpuArrow(item: DrawItem, frame?: Bounds): FarPrimitive[] {
  const d = item.data as ArrowData;
  const clip = frame ? { clip: frame } : {};
  const route = arrowRoute(item as DrawItem<ArrowData>);
  const color = colorCss(d.stroke.color ?? "ink");
  const w = Math.max(1, d.stroke.width);
  const dash = dashLengths(d.stroke.dash, w);
  const out: FarPrimitive[] = [
    {
      type: "line",
      points: route.flatMap((p) => [p.x, p.y]),
      color,
      width: w,
      cap: "butt",
      ...(dash ? { dash } : {}),
      ...clip,
    },
  ];
  const size = 6 + w * 2;
  const head = (from: Point, tip: Point) => {
    const [a, b, c] = arrowHead(from, tip, size);
    out.push({ type: "triangle", points: [a.x, a.y, b.x, b.y, c.x, c.y], fill: color, ...clip });
  };
  if (d.head !== "none" && route.length > 1) head(route.at(-2)!, route.at(-1)!);
  if (d.head === "both" && route.length > 1) head(route[1]!, route[0]!);
  return out;
}

export const arrow = definePlugin({
  id: "arrow",
  name: "Arrow",
  description:
    "Lines and arrows, straight or elbow, bound to items: they follow when the items move, let go when an item is deleted, and stay bound to copies.",
  kinds: { arrow: arrowKind },
  engineRules: {
    follow: ({ before, items, changed }) => arrowFollow(before, items, changed),
    copy({ sources, copies }) {
      const ids = new Map<string, string>();
      sources.forEach((s, i) => {
        const c = copies[i];
        if (c) ids.set(s.id, c.id);
      });
      const out: Changes = [];
      for (const copy of copies) {
        const data = copy.data;
        if (data.type !== "arrow") continue;
        const end = (e: ArrowEnd) => {
          if (!e.bind) return e;
          const to = ids.get(e.bind);
          const { bind: _b, ...rest } = e;
          return to ? { ...rest, bind: to } : rest;
        };
        out.push([copy.id, { data: { ...data, start: end(data.start), end: end(data.end) } }]);
      }
      return out;
    },
  },
});
