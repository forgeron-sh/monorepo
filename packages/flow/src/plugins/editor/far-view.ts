// A flow on the GPU (the canvas's far layer), at every zoom: each node a box (under its rich card
// near, a labelled box with its ports and run marks from far), each edge its line, its dashes and
// marching dashes, its arrowhead, each group its frame and label. The same look as the DOM drew
// them (`flow.css`); the rich cards stay DOM above them near, and what takes clicks on an edge or a
// group's label is a hit test on these same shapes (`edgeAt`, `groupLabelAt`).

import type { Bounds, FarGroup, FarPrimitive, Point } from "@forgeron/canvas";
import {
  distanceToPolyline,
  edgeBounds,
  edgeGeometryWith,
  flattenPath,
  portOffset,
  type EdgePath,
  type EdgeStyle,
} from "../../core/geometry";
import type { FlowEdge, FlowGroup, FlowNode, GraphIndex } from "../../core/model";
import { edgeStatus, type RunState, type RunStatus } from "../../core/run";
import type { FarEdge, FarGroupFrame } from "../../react/plugin";
import { edgePath } from "../edges";

export { flattenPath };

const NODE_EDGE: Partial<Record<RunStatus, string>> = {
  running: "--accent",
  success: "--success",
  error: "--danger",
  handled: "--danger",
};

/** The square in the top-right corner of a node that failed and was handled, in world units. */
const HANDLED_MARK = 20;
/** A port's square (`.fg-flow-port`: 9 px, 5 px out of the node, 1 px border). */
const PORT = 9;

export interface FarNodeOptions {
  /** The zoom under which the node is its labelled box (its card is not mounted): with ports. */
  farZoom?: number;
  /** The colour token of a port's type (`PortTypeSpec.color`), if it has one. */
  portColor?: (type: string | undefined) => string | undefined;
}

/**
 * A node while the DOM does not hold its card (from far, or near while the cards come back): a
 * box with a 2-unit border (dashed when skipped), its name at 26 units cut to its width, its ports,
 * and a square in its top-right corner when a failure was handled.
 */
export function farNode<D>(
  node: FlowNode<D>,
  status: RunStatus,
  label: string,
  selected: boolean,
  options: FarNodeOptions = {},
): FarPrimitive[] {
  const { x, y } = node.position;
  const { w, h } = node.size;
  const out: FarPrimitive[] = [
    {
      type: "rect",
      x,
      y,
      w,
      h,
      fill: "--bg",
      stroke: selected ? "--accent" : (NODE_EDGE[status] ?? "--line-strong"),
      strokeWidth: 2,
      ...(status === "skipped" ? { dash: [6, 6] as const } : {}),
    },
    {
      type: "text",
      x: x + 16,
      // `.fg-flow-node-far`: 8 units of padding, a 32-unit line.
      y: y + 8 + 16,
      lineHeight: 32,
      text: label,
      size: 26,
      weight: 500,
      color: status === "skipped" ? "--ink-dim" : "--ink-muted",
      maxWidth: Math.max(0, w - 32 - (status === "handled" ? HANDLED_MARK : 0)),
      // The DOM draws the name at any size, a grey smudge at 10 %: so does the far view.
      minSize: 1,
    },
  ];
  if (status === "handled") {
    out.push({
      type: "rect",
      x: x + w - HANDLED_MARK,
      y,
      w: HANDLED_MARK,
      h: HANDLED_MARK,
      fill: "--danger",
    });
  }
  if (options.farZoom !== undefined) {
    const port = (side: "in" | "out", type: string | undefined, i: number, n: number) => {
      const color = options.portColor?.(type);
      out.push({
        type: "rect",
        x: side === "in" ? x - 5 : x + w - PORT + 5,
        y: y + portOffset(h, i, n) - 5,
        w: PORT,
        h: PORT,
        fill: "--bg",
        stroke: selected ? "--accent" : (color ?? "--line-strong"),
        strokeWidth: 1,
        crisp: true,
      });
    };
    node.inputs.forEach((p, i) => port("in", p.type, i, node.inputs.length));
    node.outputs.forEach((p, i) => port("out", p.type, i, node.outputs.length));
  }
  return out;
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

/** How an edge is shown besides its run state. */
export interface FarEdgeState {
  selected?: ReadonlySet<string>;
  /** The edge under the pointer: drawn as the selected one. */
  hover?: string | null;
  /** The edge whose end is being dragged elsewhere: grey and dashed, as skipped. */
  dragging?: string | null;
  /** Draw the arrowheads (the `edge-arrows` plugin is there). */
  arrows?: boolean;
}

/** What an edge's shape depends on of one of its nodes: where it is, its size, its ports. */
interface NodePlace {
  x: number;
  y: number;
  w: number;
  h: number;
  inputs: FlowNode["inputs"];
  outputs: FlowNode["outputs"];
}

const placeOf = <D>(n: FlowNode<D>): NodePlace => ({
  x: n.position.x,
  y: n.position.y,
  w: n.size.w,
  h: n.size.h,
  inputs: n.inputs,
  outputs: n.outputs,
});

/** The same node but for where it is. */
const sameShape = <D>(a: NodePlace, n: FlowNode<D>) =>
  a.w === n.size.w && a.h === n.size.h && a.inputs === n.inputs && a.outputs === n.outputs;

/** An edge's shapes as they were made, and the nodes' places they were made for. */
export interface FarEdgeEntry {
  /** How it was drawn: its look besides its path (run state, under the pointer, arrowheads). */
  key: string;
  /** What is drawn now: the shapes made, or them moved (`group.dx`, `group.dy`). */
  edge: FarEdge;
  /** Its look, field by field (`key` says the same in one string). */
  status?: RunStatus;
  hot?: boolean;
  arrows?: boolean;
  /** The style it was drawn with, and its two nodes then. */
  style?: EdgeStyle | EdgePath;
  from?: NodePlace;
  to?: NodePlace;
}

/**
 * Every edge of a graph, one group each (keyed by its id): its line (1.5 units, 2 when selected or
 * under the pointer; the DOM's non-scaling strokes still scale with the world's CSS zoom), dashed
 * when skipped, marching dashes over it while it runs, its arrowhead. `cache` keeps an edge's
 * shapes while its nodes and its look stay the same, so the canvas packs only the edges that
 * changed; an edge whose two nodes moved by the same whole number of units (a selection dragged)
 * keeps its shapes, moved by the group's offset: its path is not computed again.
 */
export function farEdgeGroups<D>(
  index: GraphIndex<D>,
  edges: ReadonlyArray<FlowEdge>,
  style: EdgeStyle | EdgePath,
  run: RunState | undefined,
  state: FarEdgeState = {},
  cache?: Map<string, FarEdgeEntry>,
): FarEdge[] {
  const out: FarEdge[] = [];
  const path: EdgePath =
    typeof style === "function" ? style : (a, b, around) => edgePath(a, b, style, around);
  const arrows = state.arrows ?? true;
  const { dragging, selected, hover } = state;
  for (const edge of edges) {
    const source = index.nodes.get(edge.from.node);
    const target = index.nodes.get(edge.to.node);
    if (!source || !target) continue;
    const status = dragging === edge.id ? "skipped" : run ? edgeStatus(run, edge.id) : "idle";
    const hot = dragging !== edge.id && (!!selected?.has(edge.id) || hover === edge.id);
    const hit = cache?.get(edge.id);
    if (
      hit?.from &&
      hit.to &&
      hit.status === status &&
      hit.hot === hot &&
      hit.arrows === arrows &&
      hit.style === style &&
      hit.edge.edge === edge &&
      sameShape(hit.from, source) &&
      sameShape(hit.to, target)
    ) {
      const dx = source.position.x - hit.from.x;
      const dy = source.position.y - hit.from.y;
      if (
        target.position.x - hit.to.x === dx &&
        target.position.y - hit.to.y === dy &&
        Number.isInteger(dx) &&
        Number.isInteger(dy)
      ) {
        const g = hit.edge.group;
        if ((g.dx ?? 0) !== dx || (g.dy ?? 0) !== dy) {
          hit.edge = moveEdge(hit.edge, dx, dy);
        }
        out.push(hit.edge);
        continue;
      }
    }
    const g = edgeGeometryWith(index, edge, path);
    if (!g) continue;
    const points = flattenPath(g.d);
    // A curve flattened joins its segments end to end (a square joint would overlap a translucent
    // stroke); an elbow's right angles reach past, as SVG's miter.
    const curved = g.d.includes("C");
    const prims: FarPrimitive[] = [
      {
        type: "line",
        points,
        color: hot ? "--accent" : (LINE[status] ?? "--line-strong"),
        width: hot ? 2 : 1.5,
        cap: "butt",
        ...(curved ? { joins: "butt" as const } : {}),
        ...(status === "skipped" ? { dash: [3, 4] as const } : {}),
      },
    ];
    if (status === "running") {
      // Items flowing: `.fg-flow-edge-flow`, 4 on 8 off, 12 units every 0.6 s.
      prims.push({
        type: "line",
        points,
        color: "--accent",
        width: 2,
        cap: "butt",
        ...(curved ? { joins: "butt" as const } : {}),
        dash: [4, 8],
        march: 20,
      });
    }
    const t = g.arrow.split(/[\s,]+/).map(Number);
    if (arrows && t.length === 6) {
      prims.push({
        type: "triangle",
        points: t as unknown as [number, number, number, number, number, number],
        fill: hot ? "--accent" : (HEAD[status] ?? "--line-strong"),
      });
    }
    const made: FarEdge = {
      edge,
      points,
      box: edgeBounds(g),
      mid: g.mid,
      group: { key: edge.id, prims },
    };
    cache?.set(edge.id, {
      key: `${status}|${hot}|${arrows}`,
      edge: made,
      status,
      hot,
      arrows,
      style,
      from: placeOf(source),
      to: placeOf(target),
    });
    out.push(made);
  }
  return out;
}

/**
 * An edge's shapes as made, drawn moved by `(dx, dy)` from where they were made: its group's offset
 * (nothing packed again), its box and middle moved; its points stay as made (`FarEdge.dx`).
 */
function moveEdge(made: FarEdge, dx: number, dy: number): FarEdge {
  // `made` may itself be drawn moved: its box and middle are moved back first.
  const ox = dx - (made.dx ?? 0);
  const oy = dy - (made.dy ?? 0);
  const b = made.box;
  return {
    edge: made.edge,
    points: made.points,
    box: { x: b.x + ox, y: b.y + oy, w: b.w, h: b.h },
    mid: { x: made.mid.x + ox, y: made.mid.y + oy },
    group: { key: made.group.key, prims: made.group.prims, dx, dy },
    dx,
    dy,
  };
}

/** Every edge of a graph as one list of primitives (lines and arrowheads), in order. */
export function farEdges<D>(
  index: GraphIndex<D>,
  edges: ReadonlyArray<FlowEdge>,
  style: EdgeStyle | EdgePath,
  run: RunState | undefined,
  selected: ReadonlySet<string>,
): FarPrimitive[] {
  return farEdgeGroups(index, edges, style, run, { selected }).flatMap((e) => e.group.prims);
}

/** The edge whose line passes within `tolerance` world units of `p`, the topmost (last) first. */
export function edgeAt(
  edges: ReadonlyArray<FarEdge>,
  p: Point,
  tolerance: number,
): FlowEdge | null {
  let best: FlowEdge | null = null;
  let bestD = tolerance;
  for (let i = edges.length - 1; i >= 0; i--) {
    const e = edges[i]!;
    const b = e.box;
    if (
      p.x < b.x - tolerance ||
      p.y < b.y - tolerance ||
      p.x > b.x + b.w + tolerance ||
      p.y > b.y + b.h + tolerance
    )
      continue;
    const d = distanceToPolyline(
      e.points,
      e.dx || e.dy ? { x: p.x - (e.dx ?? 0), y: p.y - (e.dy ?? 0) } : p,
    );
    if (d <= bestD) {
      bestD = d;
      best = e.edge;
    }
  }
  return best;
}

/** The frames of the groups (`groupBounds` of the groups plugin) and their labels' boxes. */
export function groupFrames<D>(
  index: GraphIndex<D>,
  groups: ReadonlyArray<FlowGroup>,
  bounds: (index: GraphIndex<D>, nodes: ReadonlyArray<string>) => Bounds | null,
): FarGroupFrame[] {
  const out: FarGroupFrame[] = [];
  for (const group of groups) {
    const b = bounds(index, group.nodes);
    if (!b) continue;
    out.push({
      group,
      frame: b,
      label: { x: b.x, y: b.y, w: Math.max(60, group.label.length * 7 + 16), h: 20 },
    });
  }
  return out;
}

/** The label under `p`, the last drawn first. */
export function groupLabelAt(frames: ReadonlyArray<FarGroupFrame>, p: Point): FlowGroup | null {
  for (let i = frames.length - 1; i >= 0; i--) {
    const l = frames[i]!.label;
    if (p.x >= l.x && p.y >= l.y && p.x <= l.x + l.w && p.y <= l.y + l.h) return frames[i]!.group;
  }
  return null;
}

/**
 * A group's frame (a 3 % wash, a dashed 1-unit line) and its label (a box and its name in mono 11
 * at the baseline the SVG text had), one group each. SVG strokes straddle the path: the boxes are
 * half a stroke larger, so the GPU's inside stroke lands where SVG's did.
 */
export function farGroups(frames: ReadonlyArray<FarGroupFrame>, hover?: string | null): FarGroup[] {
  return frames.map(({ group, frame: b, label: l }) => ({
    key: `group:${group.id}`,
    prims: [
      {
        type: "rect",
        x: b.x - 0.5,
        y: b.y - 0.5,
        w: b.w + 1,
        h: b.h + 1,
        fill: "color-mix(in srgb, var(--ink) 3%, transparent)",
        stroke: "--line",
        strokeWidth: 1,
        dash: [4, 3],
      },
      {
        type: "rect",
        x: l.x - 0.5,
        y: l.y - 0.5,
        w: l.w + 1,
        h: l.h + 1,
        fill: "--bg",
        stroke: hover === group.id ? "--accent" : "--line",
        strokeWidth: 1,
      },
      {
        type: "text",
        x: b.x + 8,
        y: b.y + 14,
        baseline: true,
        text: group.label,
        size: 11,
        font: "mono",
        color: "--ink-muted",
        minSize: 1,
      },
    ],
  }));
}
