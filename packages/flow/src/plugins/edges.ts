// The edge styles of the bundled plugins: how an edge runs between an output and an input. Pure
// geometry, no drawing: the editor half draws the path these give.
//
// Bezier: a curve that leaves and enters horizontally. Orthogonal: horizontal and vertical runs
// with square corners; an edge that goes backwards loops under its two nodes (`around`, their
// bounds) rather than through them.

import type { Bounds, Point } from "@forgeron/canvas";
import {
  ARROW,
  edgeGeometryWith,
  straightPath,
  type EdgeGeometry,
  type EdgeStyle,
} from "../core/geometry";
import type { FlowEdge, GraphIndex } from "../core/model";
import { definePlugin } from "../core/plugin";

const r = (n: number) => Math.round(n * 10) / 10;

const arrowOf = (b: Point, end: Point) =>
  `${b.x},${b.y} ${end.x},${b.y - ARROW / 2 - 1} ${end.x},${b.y + ARROW / 2 + 1}`;

export function bezierPath(a: Point, b: Point): EdgeGeometry {
  // The line stops at the base of the arrowhead; the arrowhead reaches the port.
  const end = { x: b.x - ARROW, y: b.y };
  const arrow = arrowOf(b, end);
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

export function orthogonalPath(
  a: Point,
  b: Point,
  around?: readonly [Bounds, Bounds],
): EdgeGeometry {
  const end = { x: b.x - ARROW, y: b.y };
  const arrow = arrowOf(b, end);
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

/**
 * The path of an edge between two port points in one of the bundled styles; any other id draws a
 * straight line.
 */
export function edgePath(
  a: Point,
  b: Point,
  style: EdgeStyle = "bezier",
  around?: readonly [Bounds, Bounds],
): EdgeGeometry {
  if (style === "orthogonal") return orthogonalPath(a, b, around);
  if (style === "bezier") return bezierPath(a, b);
  return straightPath(a, b);
}

/** The geometry of an edge in a graph in one of the bundled styles; null when a node is gone. */
export function edgeGeometry<D>(
  index: GraphIndex<D>,
  edge: FlowEdge,
  style: EdgeStyle,
): EdgeGeometry | null {
  return edgeGeometryWith(index, edge, (a, b, around) => edgePath(a, b, style, around));
}

export const bezier = definePlugin({
  id: "bezier",
  name: "Curved edges",
  description: "Edges as curves that leave an output and enter an input horizontally.",
  edgeStyles: { bezier: { label: "Curves", path: bezierPath } },
});

export const orthogonal = definePlugin({
  id: "orthogonal",
  name: "Stepped edges",
  description:
    "Edges as horizontal and vertical runs with square corners; a backward edge loops under its nodes.",
  edgeStyles: { orthogonal: { label: "Steps", path: orthogonalPath } },
});
