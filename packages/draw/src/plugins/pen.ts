// The pixel pen, core half: a stroke lands on a grid of pen pixels (4 world units, five to a canvas
// cell), is simplified (Ramer–Douglas–Peucker, then repeated pixels dropped) and drawn as whole
// pixels between its vertices (Bresenham), never as an anti-aliased curve.

import type { Bounds, Point } from "@forgeron/canvas";
import { distanceToPolyline } from "../core/geometry";
import { colorCss } from "../core/palette";
import { definePlugin, type KindSpec } from "../core/plugin";
import { num, readCommon, str, DrawFormatError, type Raw } from "../core/parse";
import { n } from "../core/svg";
import type { DrawColor, DrawItem, PenData } from "../core/types";

/** World units per pen pixel. */
export const PEN_PIXEL = 4;

/** Points on the pen's pixel grid: each world point to the pixel it falls in. */
export function toPixels(points: ReadonlyArray<Point>, pixel = PEN_PIXEL): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const q = { x: Math.floor(p.x / pixel), y: Math.floor(p.y / pixel) };
    const last = out.at(-1);
    if (!last || last.x !== q.x || last.y !== q.y) out.push(q);
  }
  return out;
}

/** Ramer–Douglas–Peucker: the fewest vertices that stay within `epsilon` of the line. */
export function simplify(points: ReadonlyArray<Point>, epsilon = 1): Point[] {
  if (points.length <= 2) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let worst = -1;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distanceToPolyline(points[i]!, [points[a]!, points[b]!]);
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (worst > epsilon && index > 0) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** The pixels of a line between two pixel points, both ends included (Bresenham). */
export function linePixels(a: Point, b: Point): Point[] {
  const out: Point[] = [];
  let x = a.x;
  let y = a.y;
  const dx = Math.abs(b.x - x);
  const dy = -Math.abs(b.y - y);
  const sx = x < b.x ? 1 : -1;
  const sy = y < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    out.push({ x, y });
    if (x === b.x && y === b.y) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return out;
}

const pairs = (flat: ReadonlyArray<number>): Point[] => {
  const out: Point[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i]!, y: flat[i + 1]! });
  return out;
};

/** Every lit pixel of a stroke, each once, as `x,y` keys in drawing order. */
export function strokePixels(data: Pick<PenData, "points" | "weight">): Point[] {
  const vertices = pairs(data.points);
  const seen = new Set<string>();
  const out: Point[] = [];
  const w = Math.max(1, Math.round(data.weight));
  const lo = -Math.floor((w - 1) / 2);
  const stamp = (p: Point) => {
    for (let dy = 0; dy < w; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const x = p.x + lo + dx;
        const y = p.y + lo + dy;
        const key = `${x},${y}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ x, y });
        }
      }
    }
  };
  if (vertices.length === 1) stamp(vertices[0]!);
  for (let i = 1; i < vertices.length; i++) {
    for (const p of linePixels(vertices[i - 1]!, vertices[i]!)) stamp(p);
  }
  return out;
}

/**
 * The pixels as one SVG path in the stroke's pixel box: each row's runs of lit pixels as one
 * rectangle, so a long flat stretch is one subpath rather than one per pixel.
 */
export function strokePath(data: Pick<PenData, "points" | "weight">): string {
  const rows = new Map<number, number[]>();
  for (const p of strokePixels(data)) {
    const row = rows.get(p.y);
    if (row) row.push(p.x);
    else rows.set(p.y, [p.x]);
  }
  let d = "";
  for (const y of [...rows.keys()].sort((a, b) => a - b)) {
    const xs = rows.get(y)!.sort((a, b) => a - b);
    let start = xs[0]!;
    let prev = start;
    for (let i = 1; i <= xs.length; i++) {
      const x = xs[i];
      if (x === prev + 1) {
        prev = x;
        continue;
      }
      const len = prev - start + 1;
      d += `M${start} ${y}h${len}v1h-${len}z`;
      if (x !== undefined) start = prev = x;
    }
  }
  return d;
}

/** Pixels the box keeps around the vertices for a weight: a thick stroke reaches past them. */
const margin = (weight: number) => Math.floor((Math.max(1, Math.round(weight)) - 1) / 2);

export interface PenOptions {
  color: DrawColor;
  weight: number;
  pixel?: number;
  /** Pixels of tolerance of the simplification; 1 by default. */
  epsilon?: number;
}

/**
 * A stroke drawn through world points, as the bounds and data of a pen item: on whole pixels,
 * simplified, its vertices local to its box. Null when there is no point.
 */
export function penFromPoints(
  world: ReadonlyArray<Point>,
  { color, weight, pixel = PEN_PIXEL, epsilon = 1 }: PenOptions,
): { bounds: Bounds; data: PenData } | null {
  const px = simplify(toPixels(world, pixel), epsilon);
  if (px.length === 0) return null;
  const m = margin(weight);
  const x0 = Math.min(...px.map((p) => p.x)) - m;
  const y0 = Math.min(...px.map((p) => p.y)) - m;
  const x1 = Math.max(...px.map((p) => p.x)) + Math.max(1, Math.round(weight)) - m;
  const y1 = Math.max(...px.map((p) => p.y)) + Math.max(1, Math.round(weight)) - m;
  const cols = x1 - x0;
  const rows = y1 - y0;
  return {
    bounds: { x: x0 * pixel, y: y0 * pixel, w: cols * pixel, h: rows * pixel },
    data: {
      type: "pen",
      points: px.flatMap((p) => [p.x - x0, p.y - y0]),
      cols,
      rows,
      color,
      weight: Math.max(1, Math.round(weight)),
    },
  };
}

/** Whether a world point touches the stroke, within `reach` world units of its line. */
export function penHit(item: DrawItem<PenData>, point: Point, reach = 4): boolean {
  const { bounds: b, data } = item;
  if (b.w <= 0 || b.h <= 0 || data.cols <= 0 || data.rows <= 0) return false;
  const sx = data.cols / b.w;
  const sy = data.rows / b.h;
  const local = { x: (point.x - b.x) * sx, y: (point.y - b.y) * sy };
  const line = pairs(data.points).map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 }));
  return distanceToPolyline(local, line) <= data.weight / 2 + reach * Math.max(sx, sy);
}

const penKind: KindSpec = {
  type: "pen",
  label: "Pen stroke",
  canvas: {
    resize: { keepAspect: true, minW: 4, minH: 4 },
    hitTest: (i, p) => penHit(i as DrawItem<PenData>, p),
  },
  parse(raw: Raw, at) {
    const points = raw.points;
    if (!Array.isArray(points) || points.length % 2 || !points.every(Number.isInteger))
      throw new DrawFormatError(`${at}.data.points must be pairs of whole pixels.`);
    return {
      type: "pen",
      points: points as number[],
      cols: Math.max(1, num(raw.cols, 1)),
      rows: Math.max(1, num(raw.rows, 1)),
      color: str(raw.color, "ink"),
      weight: Math.min(4, Math.max(1, Math.round(num(raw.weight, 1)))),
      ...readCommon(raw),
    };
  },
  paint(item, o) {
    const d = item.data as PenData;
    const b = item.bounds;
    const sx = b.w / Math.max(1, d.cols);
    const sy = b.h / Math.max(1, d.rows);
    return [
      n("path", {
        d: strokePath(d),
        fill: o.color(d.color),
        shapeRendering: "crispEdges",
        transform: `translate(${b.x} ${b.y}) scale(${sx} ${sy})`,
      }),
    ];
  },
  far(item, frame) {
    // Far out, a stroke is its line: its pixels would be smaller than a screen pixel. The DOM's
    // non-scaling stroke still takes the world's CSS scale, so the line is one world unit wide.
    const d = item.data as PenData;
    const b = item.bounds;
    const clip = frame ? { clip: frame } : {};
    const sx = b.w / Math.max(1, d.cols);
    const sy = b.h / Math.max(1, d.rows);
    const points: number[] = [];
    for (let i = 0; i + 1 < d.points.length; i += 2) {
      points.push(b.x + (d.points[i]! + 0.5) * sx, b.y + (d.points[i + 1]! + 0.5) * sy);
    }
    return [{ type: "line", points, color: colorCss(d.color), width: 1, ...clip }];
  },
};

export const pen = definePlugin({
  id: "pen",
  name: "Pixel pen",
  description: "Freehand strokes on a 4 px grid, simplified and drawn as whole pixels.",
  kinds: { pen: penKind },
});
