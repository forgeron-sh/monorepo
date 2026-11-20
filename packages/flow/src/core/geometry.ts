// Where ports sit on a node and the path an edge takes between two of them. Inputs are on the left
// side, outputs on the right, spread evenly down the side; an edge leaves to the right and enters
// from the left, so a left-to-right layout reads without a turn. Whole world units, for crisp lines.

import type { Bounds, Point } from "@forgeron/canvas";
import type { FlowEdge, FlowNode, GraphIndex, PortSide } from "./model";

/** The id of an edge style: `bezier` and `orthogonal` come with the bundled plugins. */
export type EdgeStyle = "bezier" | "orthogonal" | (string & {});

/** The distance from the top of a node to its `index`-th port of `count` on one side. */
export function portOffset(height: number, index: number, count: number): number {
  return Math.round((height * (index + 1)) / (count + 1));
}

/** The world point of a port, on the left (inputs) or right (outputs) side of its node. */
export function portPoint<D>(node: FlowNode<D>, side: PortSide, portId: string): Point {
  const ports = side === "in" ? node.inputs : node.outputs;
  const i = Math.max(
    0,
    ports.findIndex((p) => p.id === portId),
  );
  return {
    x: node.position.x + (side === "in" ? 0 : node.size.w),
    y: node.position.y + portOffset(node.size.h, i, Math.max(1, ports.length)),
  };
}

export interface EdgeGeometry {
  /** The SVG path, in world units. */
  d: string;
  /** Halfway along the edge: where an "insert" button goes. */
  mid: Point;
  from: Point;
  to: Point;
  /** The arrowhead at `to`, pointing right, as SVG polygon points. */
  arrow: string;
}

/** The size of the arrowhead, in world units. */
export const ARROW = 6;

/** The path of an edge from an output at `a` to an input at `b`. */
export type EdgePath = (a: Point, b: Point, around?: readonly [Bounds, Bounds]) => EdgeGeometry;

/**
 * What an edge is drawn with when no plugin brings the style asked for: a straight line to the
 * base of the arrowhead. Everything an editor needs of an edge (ends, box, middle) is there.
 */
export const straightPath: EdgePath = (a, b) => {
  const end = { x: b.x - ARROW, y: b.y };
  return {
    d: `M${a.x} ${a.y}L${end.x} ${end.y}`,
    mid: { x: Math.round((a.x + end.x) / 2), y: Math.round((a.y + end.y) / 2) },
    from: a,
    to: b,
    arrow: `${b.x},${b.y} ${end.x},${b.y - ARROW / 2 - 1} ${end.x},${b.y + ARROW / 2 + 1}`,
  };
};

const boundsOf = <D>(n: FlowNode<D>): Bounds => ({ ...n.position, ...n.size });

/**
 * The box around an edge: its path (the absolute M, C, H, V and L commands that `edgePath` writes; a
 * curve lies inside its control points) and its arrowhead. For culling edges out of view.
 */
export function edgeBounds(g: EdgeGeometry): Bounds {
  let x1 = Math.min(g.from.x, g.to.x);
  let y1 = Math.min(g.from.y, g.to.y) - ARROW;
  let x2 = Math.max(g.from.x, g.to.x);
  let y2 = Math.max(g.from.y, g.to.y) + ARROW;
  let x = 0;
  let y = 0;
  const add = (px: number, py: number) => {
    x = px;
    y = py;
    x1 = Math.min(x1, x);
    y1 = Math.min(y1, y);
    x2 = Math.max(x2, x);
    y2 = Math.max(y2, y);
  };
  for (const [, cmd, args] of g.d.matchAll(/([MCHVL])([^MCHVL]*)/g)) {
    const n = args!
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (cmd === "H") for (const v of n) add(v, y);
    else if (cmd === "V") for (const v of n) add(x, v);
    else for (let i = 0; i + 1 < n.length; i += 2) add(n[i]!, n[i + 1]!);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** The geometry of an edge in a graph, drawn with `path`; null when one of its nodes is gone. */
export function edgeGeometryWith<D>(
  index: GraphIndex<D>,
  edge: FlowEdge,
  path: EdgePath,
): EdgeGeometry | null {
  const source = index.nodes.get(edge.from.node);
  const target = index.nodes.get(edge.to.node);
  if (!source || !target) return null;
  return path(portPoint(source, "out", edge.from.port), portPoint(target, "in", edge.to.port), [
    boundsOf(source),
    boundsOf(target),
  ]);
}

/**
 * The points of an edge's path (`M`, `C`, `H`, `V`, `L` as the edge styles write them), flat
 * `[x0, y0, x1, y1…]`, curves flattened: into `steps` segments each, or, without it, into
 * segments of about 8 world units (6 to 48 a curve): within a tenth of a unit of the curve on the
 * bends edges make, smooth at 200 %.
 */
export function flattenPath(d: string, steps?: number): number[] {
  const out: number[] = [];
  let x = 0;
  let y = 0;
  for (const [, cmd, args] of d.matchAll(/([MCHVL])([^MCHVL]*)/g)) {
    const n = args!
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (cmd === "M") {
      x = n[0]!;
      y = n[1]!;
      out.push(x, y);
    } else if (cmd === "L") {
      for (let i = 0; i + 1 < n.length; i += 2) out.push((x = n[i]!), (y = n[i + 1]!));
    } else if (cmd === "H") {
      for (const v of n) out.push((x = v), y);
    } else if (cmd === "V") {
      for (const v of n) out.push(x, (y = v));
    } else {
      for (let i = 0; i + 5 < n.length; i += 6) {
        const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6) as [
          number,
          number,
          number,
          number,
          number,
          number,
        ];
        // The control polygon is longer than the curve: enough segments either way.
        const hull =
          Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
        const k = steps ?? Math.max(6, Math.min(48, Math.ceil(hull / 8)));
        for (let s = 1; s <= k; s++) {
          const t = s / k;
          const u = 1 - t;
          const a = u * u * u;
          const b = 3 * u * u * t;
          const c = 3 * u * t * t;
          const e = t * t * t;
          out.push(a * x + b * x1 + c * x2 + e * x3, a * y + b * y1 + c * y2 + e * y3);
        }
        x = x3;
        y = y3;
      }
    }
  }
  return out;
}

/** The distance from `p` to a polyline, flat `[x0, y0, x1, y1…]`. */
export function distanceToPolyline(points: ArrayLike<number>, p: Point): number {
  let best = Infinity;
  for (let i = 0; i + 3 < points.length; i += 2) {
    const ax = points[i]!;
    const ay = points[i + 1]!;
    const dx = points[i + 2]! - ax;
    const dy = points[i + 3]! - ay;
    const len = dx * dx + dy * dy;
    const t = len > 0 ? Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / len)) : 0;
    best = Math.min(best, Math.hypot(p.x - (ax + t * dx), p.y - (ay + t * dy)));
  }
  return best;
}
