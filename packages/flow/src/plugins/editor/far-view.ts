// A flow seen from far (a zoom under `farZoom`), as canvas far primitives: each node a plain box
// with its name, each edge its line and its arrowhead, in the colours of its run state. The same
// look as the DOM's far view (`flow.css`, `.fg-flow-node-far` and the edges), drawn on the GPU by
// the canvas's far layer.

import type { FarPrimitive } from "@forgeron/canvas";
import { edgeGeometryWith, type EdgePath, type EdgeStyle } from "../../core/geometry";
import type { FlowEdge, FlowNode, GraphIndex } from "../../core/model";
import { edgeStatus, type RunState, type RunStatus } from "../../core/run";
import { edgePath } from "../edges";

const NODE_EDGE: Partial<Record<RunStatus, string>> = {
  running: "--accent",
  success: "--success",
  error: "--danger",
  handled: "--danger",
};

/** The square in the top-right corner of a node that failed and was handled, in world units. */
const HANDLED_MARK = 20;

/**
 * A node from far: a box with a 2-unit border and its name at 26 units, cut to its width; a
 * failure that was handled has a square in its top-right corner too.
 */
export function farNode<D>(
  node: FlowNode<D>,
  status: RunStatus,
  label: string,
  selected: boolean,
): FarPrimitive[] {
  const { x, y } = node.position;
  const { w, h } = node.size;
  return [
    {
      type: "rect",
      x,
      y,
      w,
      h,
      fill: "--bg",
      stroke: selected ? "--accent" : (NODE_EDGE[status] ?? "--line-strong"),
      strokeWidth: 2,
    },
    {
      type: "text",
      x: x + 16,
      y: y + 26,
      text: label,
      size: 26,
      weight: 500,
      color: status === "skipped" ? "--ink-dim" : "--ink-muted",
      maxWidth: Math.max(0, w - 32 - (status === "handled" ? HANDLED_MARK : 0)),
      // The DOM draws the name at any size, a grey smudge at 10 %: so does the far view.
      minSize: 1,
    },
    ...(status === "handled"
      ? [
          {
            type: "rect" as const,
            x: x + w - HANDLED_MARK,
            y,
            w: HANDLED_MARK,
            h: HANDLED_MARK,
            fill: "--danger",
          },
        ]
      : []),
  ];
}

const LINE: Partial<Record<RunStatus, string>> = {
  success: "--success",
  error: "--danger",
  skipped: "--line",
  running: "color-mix(in srgb, var(--accent) 35%, transparent)",
};
const HEAD: Partial<Record<RunStatus, string>> = {
  success: "--success",
  skipped: "--line",
  running: "--accent",
};

/** The points of an edge's path (`M`, `C`, `H`, `V`, `L` as the edge styles write them), curves flattened. */
export function flattenPath(d: string, steps = 12): number[] {
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
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
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

/**
 * Every edge of a graph from far: its line and its arrowhead. The DOM's edges are non-scaling
 * strokes inside the world's CSS scale, which still scales them: 1.5 world units, 2 when selected.
 */
export function farEdges<D>(
  index: GraphIndex<D>,
  edges: ReadonlyArray<FlowEdge>,
  style: EdgeStyle | EdgePath,
  run: RunState | undefined,
  selected: ReadonlySet<string>,
): FarPrimitive[] {
  const out: FarPrimitive[] = [];
  const path: EdgePath =
    typeof style === "function" ? style : (a, b, around) => edgePath(a, b, style, around);
  for (const edge of edges) {
    const g = edgeGeometryWith(index, edge, path);
    if (!g) continue;
    const status = edgeStatus(run, edge.id);
    const sel = selected.has(edge.id);
    out.push({
      type: "line",
      points: flattenPath(g.d),
      color: sel ? "--accent" : (LINE[status] ?? "--line-strong"),
      width: sel ? 2 : 1.5,
    });
    const t = g.arrow.split(/[\s,]+/).map(Number);
    if (t.length === 6) {
      out.push({
        type: "triangle",
        points: t as unknown as [number, number, number, number, number, number],
        fill: sel ? "--accent" : (HEAD[status] ?? "--line-strong"),
      });
    }
  }
  return out;
}
