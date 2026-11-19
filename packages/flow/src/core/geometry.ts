// Where ports sit on a node and the path an edge takes between two of them. Inputs are on the left
// side, outputs on the right, spread evenly down the side; an edge leaves to the right and enters
// from the left, so a left-to-right layout reads without a turn. Whole world units, for crisp lines.

import type { Bounds, Point } from "@forgeron/canvas";
import type { FlowEdge, FlowNode, GraphIndex, PortSide } from "./model";

export type EdgeStyle = "bezier" | "orthogonal";

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

const r = (n: number) => Math.round(n * 10) / 10;

/**
 * The path of an edge from an output at `a` to an input at `b`. Bezier: a curve that leaves and
 * enters horizontally. Orthogonal: horizontal and vertical runs with square corners; an edge that
 * goes backwards loops under its two nodes (`around`, their bounds) rather than through them.
 */
export function edgePath(
  a: Point,
  b: Point,
  style: EdgeStyle = "bezier",
  around?: readonly [Bounds, Bounds],
): EdgeGeometry {
  // The line stops at the base of the arrowhead; the arrowhead reaches the port.
  const end = { x: b.x - ARROW, y: b.y };
  const arrow = `${b.x},${b.y} ${end.x},${b.y - ARROW / 2 - 1} ${end.x},${b.y + ARROW / 2 + 1}`;
  if (style === "orthogonal") {
    const out = 20;
    if (end.x - a.x >= out * 2) {
      const mx = Math.round((a.x + end.x) / 2);
      return {
        d: `M${a.x} ${a.y}H${mx}V${end.y}H${end.x}`,
        mid: { x: mx, y: Math.round((a.y + end.y) / 2) },
        from: a,
        to: b,
        arrow,
      };
    }
    // Backwards: out to the right, down under both nodes, back to the left, in.
    const below = around
      ? Math.max(around[0].y + around[0].h, around[1].y + around[1].h) + out
      : Math.max(a.y, end.y) + out * 3;
    const x1 = a.x + out;
    const x2 = end.x - out;
    return {
      d: `M${a.x} ${a.y}H${x1}V${below}H${x2}V${end.y}H${end.x}`,
      mid: { x: Math.round((x1 + x2) / 2), y: below },
      from: a,
      to: b,
      arrow,
    };
  }
  const dx = Math.max(40, Math.abs(end.x - a.x) / 2);
  const c1 = { x: a.x + dx, y: a.y };
  const c2 = { x: end.x - dx, y: end.y };
  // The curve at t = 0.5: (P0 + 3 P1 + 3 P2 + P3) / 8.
  const mid = {
    x: r((a.x + 3 * c1.x + 3 * c2.x + end.x) / 8),
    y: r((a.y + 3 * c1.y + 3 * c2.y + end.y) / 8),
  };
  return {
    d: `M${a.x} ${a.y}C${r(c1.x)} ${c1.y} ${r(c2.x)} ${c2.y} ${end.x} ${end.y}`,
    mid,
    from: a,
    to: b,
    arrow,
  };
}

const boundsOf = <D>(n: FlowNode<D>): Bounds => ({ ...n.position, ...n.size });

/**
 * The box around an edge: its path (the absolute M, C, H and V commands that `edgePath` writes; a
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
  for (const [, cmd, args] of g.d.matchAll(/([MCHV])([^MCHV]*)/g)) {
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

/** The geometry of an edge in a graph, or null when one of its nodes is gone. */
export function edgeGeometry<D>(
  index: GraphIndex<D>,
  edge: FlowEdge,
  style: EdgeStyle,
): EdgeGeometry | null {
  const source = index.nodes.get(edge.from.node);
  const target = index.nodes.get(edge.to.node);
  if (!source || !target) return null;
  return edgePath(
    portPoint(source, "out", edge.from.port),
    portPoint(target, "in", edge.to.port),
    style,
    [boundsOf(source), boundsOf(target)],
  );
}

/** The frame of a group: its nodes' bounds plus a margin, with room for the label on top. */
export function groupBounds<D>(
  index: GraphIndex<D>,
  nodes: ReadonlyArray<string>,
  padding = 20,
  label = 20,
): Bounds | null {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const id of nodes) {
    const n = index.nodes.get(id);
    if (!n) continue;
    x1 = Math.min(x1, n.position.x);
    y1 = Math.min(y1, n.position.y);
    x2 = Math.max(x2, n.position.x + n.size.w);
    y2 = Math.max(y2, n.position.y + n.size.h);
  }
  if (x1 === Infinity) return null;
  return {
    x: x1 - padding,
    y: y1 - padding - label,
    w: x2 - x1 + padding * 2,
    h: y2 - y1 + padding * 2 + label,
  };
}
