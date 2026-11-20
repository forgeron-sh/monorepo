// Auto-layout: a layered drawing, left to right, in the manner of Sugiyama. Written here rather
// than taken from a graph library (D-148: the engine is small enough to own).
//
//   1. Cycles are broken by turning the back edges of a depth-first search around.
//   2. Layers: the longest path from the sources; a source moves right next to its first successor.
//   3. An edge that spans several layers goes through a chain of virtual nodes, one per layer.
//   4. Order in each layer: barycentre sweeps, down and up, keeping the order with fewest crossings
//      (counted exactly, layer pair by layer pair). Ports count: a `true` output sits above `false`.
//   5. Vertical places: each layer is set where its edges are straightest, keeping its order and
//      its gaps, by isotonic regression (pool adjacent violators), sweeping down and up.
//   6. Snapped to the grid, layers side by side.
//
// Groups are laid out as blocks, so that two frames never overlap and a node never sits inside a
// frame it is not in: each group's own nodes are laid out first, by themselves; then the group is
// one box (its drawing plus the frame's margin and label) in the drawing of the whole graph, among
// the nodes in no group, with its edges leaving from where their nodes sit inside it.
//
// Every step reads nodes and edges in document order and breaks ties the same way: the same graph
// always gives the same drawing.

import type { Point } from "@forgeron/canvas";
import { portOffset } from "./geometry";
import type { FlowGraph } from "./model";

export interface LayoutOptions {
  /** Between two layers, in world units. 80 by default. */
  layerGap?: number;
  /** Between two nodes of a layer. 40 by default. */
  nodeGap?: number;
  /** Between a long edge's lane and what is next to it. 20 by default. */
  edgeGap?: number;
  /** Positions land on this grid; 20 by default, 0 for none. */
  grid?: number;
  /** Crossing-reduction sweeps. 12 by default. */
  sweeps?: number;
  /** Straightening passes. 8 by default. */
  passes?: number;
  /** Where the top-left of the drawing goes. */
  origin?: Point;
  /**
   * Around a group's nodes, the room its frame takes: the margin on each side and the label on
   * top. `groupBounds`'s defaults, 20 and 20.
   */
  groupPadding?: number;
  groupLabel?: number;
}

export interface LayoutResult {
  /** The top-left corner of each node. */
  positions: Map<string, Point>;
  /** The nodes of each layer, top to bottom. */
  layers: string[][];
  /** Crossings left between the layers (virtual nodes included). */
  crossings: number;
  /** The edges turned around to break cycles. */
  reversed: string[];
}

interface Vertex {
  /** A box, or a virtual node of a long edge. */
  real: boolean;
  w: number;
  h: number;
  layer: number;
}

interface Segment {
  u: number;
  v: number;
  /** Where the segment meets u and v, from their tops. */
  ou: number;
  ov: number;
}

/** A box to place: a node, or a whole group. */
interface Box {
  w: number;
  h: number;
}

/** An edge between two boxes, by index, and where it meets each from its top. */
interface Link {
  id: string;
  a: number;
  b: number;
  oa: number;
  ob: number;
}

interface Layered {
  /** The top-left corner of each box. */
  at: Point[];
  /** The boxes of each layer, top to bottom. */
  layers: number[][];
  crossings: number;
  reversed: string[];
}

type Settings = Required<Omit<LayoutOptions, "origin">>;

export function layoutGraph<D>(graph: FlowGraph<D>, options: LayoutOptions = {}): LayoutResult {
  const settings: Settings = {
    layerGap: options.layerGap ?? 80,
    nodeGap: options.nodeGap ?? 40,
    edgeGap: options.edgeGap ?? 20,
    grid: options.grid ?? 20,
    sweeps: options.sweeps ?? 12,
    passes: options.passes ?? 8,
    groupPadding: options.groupPadding ?? 20,
    groupLabel: options.groupLabel ?? 20,
  };
  const origin = options.origin ?? { x: 0, y: 0 };
  const nodes = graph.nodes;
  const at = new Map(nodes.map((node, i) => [node.id, i] as const));
  // Where each edge meets its nodes, from their tops; edges to unknown nodes and loops are left out.
  const ends = graph.edges.flatMap((e) => {
    const a = at.get(e.from.node);
    const b = at.get(e.to.node);
    if (a === undefined || b === undefined || a === b) return [];
    const src = nodes[a]!;
    const dst = nodes[b]!;
    const oi = Math.max(
      0,
      src.outputs.findIndex((p) => p.id === e.from.port),
    );
    const ii = Math.max(
      0,
      dst.inputs.findIndex((p) => p.id === e.to.port),
    );
    return [
      {
        id: e.id,
        a,
        b,
        oa: portOffset(src.size.h, oi, Math.max(1, src.outputs.length)),
        ob: portOffset(dst.size.h, ii, Math.max(1, dst.inputs.length)),
      },
    ];
  });

  // The group of each node (the first that names it), groups in document order.
  const groupOf = new Int32Array(nodes.length).fill(-1);
  const members: number[][] = [];
  for (const g of graph.groups) {
    const list: number[] = [];
    for (const id of g.nodes) {
      const i = at.get(id);
      if (i === undefined || groupOf[i] !== -1) continue;
      groupOf[i] = members.length;
      list.push(i);
    }
    if (list.length) members.push(list.sort((p, q) => p - q));
  }

  const positions = new Map<string, Point>();
  if (members.length === 0) {
    const r = layered(
      nodes.map((n) => n.size),
      ends,
      settings,
    );
    nodes.forEach((n, i) =>
      positions.set(n.id, {
        x: r.at[i]!.x + snapTo(origin.x, settings.grid),
        y: r.at[i]!.y + snapTo(origin.y, settings.grid),
      }),
    );
    return {
      positions,
      layers: r.layers.map((l) => l.map((i) => nodes[i]!.id)),
      crossings: r.crossings,
      reversed: r.reversed,
    };
  }

  // Each group by itself: its nodes and the edges between them.
  const { groupPadding: pad, groupLabel: label } = settings;
  const local: Point[] = nodes.map(() => ({ x: 0, y: 0 }));
  const blocks: Box[] = [];
  let crossings = 0;
  const reversed: string[] = [];
  for (const list of members) {
    const where = new Map(list.map((v, k) => [v, k] as const));
    const inner = ends.flatMap((l) => {
      const a = where.get(l.a);
      const b = where.get(l.b);
      return a === undefined || b === undefined ? [] : [{ ...l, a, b }];
    });
    const r = layered(
      list.map((v) => nodes[v]!.size),
      inner,
      settings,
    );
    let w = 0;
    let h = 0;
    list.forEach((v, k) => {
      const p = { x: r.at[k]!.x + pad, y: r.at[k]!.y + pad + label };
      local[v] = p;
      w = Math.max(w, p.x + nodes[v]!.size.w);
      h = Math.max(h, p.y + nodes[v]!.size.h);
    });
    blocks.push({ w: snapUpTo(w + pad, settings.grid), h: snapUpTo(h + pad, settings.grid) });
    crossings += r.crossings;
    reversed.push(...r.reversed);
  }

  // The whole graph: one box per group, one per node in none, in document order of their first
  // node; the edges between two boxes leave from where their nodes sit inside them.
  const unit = new Int32Array(nodes.length);
  const boxes: Box[] = [];
  const firstOfGroup = new Int32Array(members.length).fill(-1);
  for (let i = 0; i < nodes.length; i++) {
    const g = groupOf[i]!;
    if (g === -1) {
      unit[i] = boxes.push(nodes[i]!.size) - 1;
    } else {
      if (firstOfGroup[g] === -1) firstOfGroup[g] = boxes.push(blocks[g]!) - 1;
      unit[i] = firstOfGroup[g]!;
    }
  }
  const outer = ends.flatMap((l) => {
    const a = unit[l.a]!;
    const b = unit[l.b]!;
    if (a === b) return [];
    return [{ id: l.id, a, b, oa: local[l.a]!.y + l.oa, ob: local[l.b]!.y + l.ob }];
  });
  const r = layered(boxes, outer, settings);
  crossings += r.crossings;
  reversed.push(...r.reversed);
  const ox = snapTo(origin.x, settings.grid);
  const oy = snapTo(origin.y, settings.grid);
  nodes.forEach((n, i) => {
    const box = r.at[unit[i]!]!;
    positions.set(n.id, { x: box.x + local[i]!.x + ox, y: box.y + local[i]!.y + oy });
  });

  // The columns: the nodes by their left edge, each column top to bottom.
  const columns = new Map<number, Array<[number, string]>>();
  for (const [id, p] of positions) {
    const list = columns.get(p.x) ?? [];
    list.push([p.y, id]);
    columns.set(p.x, list);
  }
  const layers = [...columns.entries()]
    .sort((p, q) => p[0] - q[0])
    .map(([, list]) => list.sort((p, q) => p[0] - q[0]).map(([, id]) => id));
  return { positions, layers, crossings, reversed: reversed.sort() };
}

const snapTo = (v: number, grid: number) => (grid > 0 ? Math.round(v / grid) * grid : v);
const snapUpTo = (v: number, grid: number) => (grid > 0 ? Math.ceil(v / grid - 1e-9) * grid : v);

/** The layered drawing of boxes and the links between them, its top-left at 0, 0. */
function layered(
  boxes: ReadonlyArray<Box>,
  edges: ReadonlyArray<Link>,
  settings: Settings,
): Layered {
  const { layerGap, nodeGap, edgeGap, grid, sweeps, passes } = settings;
  const n = boxes.length;

  /* ---- 1. edges between known nodes, back edges turned around */

  const outs: Link[][] = boxes.map(() => []);
  for (const l of edges) outs[l.a]!.push(l);
  const state = new Uint8Array(n); // 0 new, 1 on the stack, 2 done
  const links: Link[] = [];
  const reversed: string[] = [];
  for (let s = 0; s < n; s++) {
    if (state[s]) continue;
    const stack: Array<[number, number]> = [[s, 0]];
    state[s] = 1;
    while (stack.length) {
      const top = stack[stack.length - 1]!;
      const [v, k] = top;
      const list = outs[v]!;
      if (k >= list.length) {
        state[v] = 2;
        stack.pop();
        continue;
      }
      top[1]++;
      const l = list[k]!;
      if (state[l.b] === 1) {
        reversed.push(l.id);
        links.push({ id: l.id, a: l.b, b: l.a, oa: l.ob, ob: l.oa });
      } else {
        links.push(l);
        if (state[l.b] === 0) {
          state[l.b] = 1;
          stack.push([l.b, 0]);
        }
      }
    }
  }
  // Document order for what follows, not the order the search met the links in.
  links.sort((p, q) => p.a - q.a || p.b - q.b);

  /* ---- 2. layers */

  const succ: number[][] = boxes.map(() => []);
  const indeg = new Int32Array(n);
  for (const l of links) {
    succ[l.a]!.push(l.b);
    indeg[l.b]!++;
  }
  const layer = new Int32Array(n);
  const order: number[] = [];
  {
    const left = Int32Array.from(indeg);
    let ready: number[] = [];
    for (let i = 0; i < n; i++) if (left[i] === 0) ready.push(i);
    while (ready.length) {
      const next: number[] = [];
      for (const v of ready) {
        order.push(v);
        for (const w of succ[v]!) {
          layer[w] = Math.max(layer[w]!, layer[v]! + 1);
          if (--left[w]! === 0) next.push(w);
        }
      }
      ready = next.sort((p, q) => p - q);
    }
  }
  // A source sits just before its nearest successor (a trigger feeding a late merge).
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i]!;
    if (indeg[v] !== 0 || succ[v]!.length === 0) continue;
    let min = Infinity;
    for (const w of succ[v]!) min = Math.min(min, layer[w]!);
    layer[v] = min - 1;
  }

  /* ---- 3. virtual nodes */

  const verts: Vertex[] = boxes.map((box, i) => ({
    real: true,
    w: box.w,
    h: box.h,
    layer: layer[i]!,
  }));
  const segs: Segment[] = [];
  for (const l of links) {
    let u = l.a;
    let ou = l.oa;
    for (let k = layer[l.a]! + 1; k < layer[l.b]!; k++) {
      const d = verts.push({ real: false, w: 0, h: 0, layer: k }) - 1;
      segs.push({ u, v: d, ou, ov: 0 });
      u = d;
      ou = 0;
    }
    segs.push({ u, v: l.b, ou, ov: l.ob });
  }
  const V = verts.length;
  const ins: Segment[][] = verts.map(() => []);
  const outsOf: Segment[][] = verts.map(() => []);
  for (const s of segs) {
    outsOf[s.u]!.push(s);
    ins[s.v]!.push(s);
  }
  let L = 0;
  for (const v of verts) L = Math.max(L, v.layer + 1);

  /* ---- 4. order within layers */

  const frac = (v: number, offset: number) => {
    const h = verts[v]!.h;
    return h > 0 ? offset / h : 0.5;
  };
  const pos = new Float64Array(V);
  const layers: number[][] = Array.from({ length: L }, () => []);
  // First order: layer 0 in document order, each next layer by the barycentre of its parents.
  for (let v = 0; v < V; v++) if (verts[v]!.layer === 0) layers[0]!.push(v);
  layers[0]!.forEach((v, i) => (pos[v] = i));
  const orderBy = (list: number[], key: (v: number) => number | null) => {
    // A vertex with nothing to follow keeps its own rank as its key.
    const keyed = list.map((v) => ({ v, k: key(v) ?? pos[v]!, p: pos[v]! }));
    keyed.sort((x, y) => x.k - y.k || x.p - y.p);
    list.length = 0;
    for (const { v } of keyed) list.push(v);
    list.forEach((v, i) => (pos[v] = i));
  };
  const barycentre = (v: number, down: boolean): number | null => {
    const list = down ? ins[v]! : outsOf[v]!;
    if (list.length === 0) return null;
    let sum = 0;
    for (const s of list) sum += down ? pos[s.u]! + frac(s.u, s.ou) : pos[s.v]! + frac(s.v, s.ov);
    return sum / list.length;
  };
  {
    const byLayer: number[][] = Array.from({ length: L }, () => []);
    for (let v = 0; v < V; v++) if (verts[v]!.layer > 0) byLayer[verts[v]!.layer]!.push(v);
    for (let k = 1; k < L; k++) {
      const list = byLayer[k]!;
      list.forEach((v, i) => (pos[v] = n + i)); // no place yet: after everything, in order
      layers[k] = list;
      orderBy(list, (v) => barycentre(v, true));
    }
  }

  const between = (k: number) => {
    // Crossings between layer k and k + 1: inversions of the far ends, sorted by the near ends.
    const list: Array<[number, number]> = [];
    for (const u of layers[k]!) {
      for (const s of outsOf[u]!)
        list.push([pos[s.u]! + frac(s.u, s.ou), pos[s.v]! + frac(s.v, s.ov)]);
    }
    list.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    return inversions(list.map((x) => x[1]));
  };
  const crossingsAll = () => {
    let c = 0;
    for (let k = 0; k + 1 < L; k++) c += between(k);
    return c;
  };
  let best = layers.map((l) => [...l]);
  let bestCount = crossingsAll();
  for (let sweep = 0; sweep < sweeps && bestCount > 0; sweep++) {
    const down = sweep % 2 === 0;
    if (down) for (let k = 1; k < L; k++) orderBy(layers[k]!, (v) => barycentre(v, true));
    else for (let k = L - 2; k >= 0; k--) orderBy(layers[k]!, (v) => barycentre(v, false));
    const count = crossingsAll();
    if (count < bestCount) {
      bestCount = count;
      best = layers.map((l) => [...l]);
    }
  }
  for (let k = 0; k < L; k++) {
    layers[k] = best[k]!;
    layers[k]!.forEach((v, i) => (pos[v] = i));
  }

  /* ---- 5. vertical places */

  const y = new Float64Array(V);
  const gapAfter = (a: number, b: number) =>
    !verts[a]!.real || !verts[b]!.real ? edgeGap : nodeGap;
  for (const list of layers) {
    let cursor = 0;
    list.forEach((v, i) => {
      if (i > 0) cursor += gapAfter(list[i - 1]!, v);
      y[v] = cursor;
      cursor += verts[v]!.h;
    });
  }
  const place = (list: number[]) => {
    // Wanted top of each vertex: where its edges would be level, both sides counted.
    const m = list.length;
    const c = new Float64Array(m);
    const t = new Float64Array(m);
    const w = new Float64Array(m);
    let cum = 0;
    for (let i = 0; i < m; i++) {
      const v = list[i]!;
      if (i > 0) cum += verts[list[i - 1]!]!.h + gapAfter(list[i - 1]!, v);
      c[i] = cum;
      let sum = 0;
      let count = 0;
      for (const s of ins[v]!) {
        sum += y[s.u]! + s.ou - s.ov;
        count++;
      }
      for (const s of outsOf[v]!) {
        sum += y[s.v]! + s.ov - s.ou;
        count++;
      }
      const wanted = count ? sum / count : y[v]!;
      t[i] = wanted - cum;
      w[i] = count || 0.25;
    }
    // Pool adjacent violators: the closest non-decreasing sequence to t, by weighted squares.
    const bw: number[] = [];
    const bs: number[] = [];
    const bn: number[] = [];
    for (let i = 0; i < m; i++) {
      bw.push(w[i]!);
      bs.push(w[i]! * t[i]!);
      bn.push(1);
      while (bw.length > 1) {
        const j = bw.length - 1;
        if (bs[j - 1]! / bw[j - 1]! <= bs[j]! / bw[j]!) break;
        bw[j - 1]! += bw[j]!;
        bs[j - 1]! += bs[j]!;
        bn[j - 1]! += bn[j]!;
        bw.pop();
        bs.pop();
        bn.pop();
      }
    }
    let i = 0;
    for (let b = 0; b < bw.length; b++) {
      const z = bs[b]! / bw[b]!;
      for (let k = 0; k < bn[b]!; k++, i++) y[list[i]!] = z + c[i]!;
    }
  };
  for (let p = 0; p < passes; p++) {
    if (p % 2 === 0) for (let k = 0; k < L; k++) place(layers[k]!);
    else for (let k = L - 1; k >= 0; k--) place(layers[k]!);
  }

  /* ---- 6. grid and columns */

  const snapUp = (v: number) => snapUpTo(v, grid);
  const snapNear = (v: number) => snapTo(v, grid);
  let top = Infinity;
  for (let v = 0; v < n; v++) top = Math.min(top, y[v]!);
  if (top === Infinity) top = 0;
  const placed: Point[] = boxes.map(() => ({ x: 0, y: 0 }));
  const out: number[][] = [];
  let x = 0;
  for (let k = 0; k < L; k++) {
    const list = layers[k]!;
    let prevBottom = -Infinity;
    let width = 0;
    const real: number[] = [];
    for (const v of list) {
      const vert = verts[v]!;
      if (!vert.real) continue;
      let yy = snapNear(y[v]! - top);
      if (yy < prevBottom + nodeGap) yy = snapUp(prevBottom + nodeGap);
      placed[v] = { x, y: yy };
      prevBottom = yy + vert.h;
      width = Math.max(width, vert.w);
      real.push(v);
    }
    out.push(real);
    x = snapUp(x + width + layerGap);
  }
  return { at: placed, layers: out, crossings: bestCount, reversed };
}

/** Pairs out of order in a list of numbers, by merge sort: O(n log n). */
function inversions(values: number[]): number {
  const a = values.slice();
  const tmp = new Array<number>(a.length);
  let count = 0;
  for (let width = 1; width < a.length; width *= 2) {
    for (let lo = 0; lo < a.length; lo += 2 * width) {
      const mid = Math.min(lo + width, a.length);
      const hi = Math.min(lo + 2 * width, a.length);
      let i = lo;
      let j = mid;
      let k = lo;
      while (i < mid && j < hi) {
        if (a[j]! < a[i]!) {
          tmp[k++] = a[j++]!;
          count += mid - i;
        } else tmp[k++] = a[i++]!;
      }
      while (i < mid) tmp[k++] = a[i++]!;
      while (j < hi) tmp[k++] = a[j++]!;
      for (let m = lo; m < hi; m++) a[m] = tmp[m]!;
    }
  }
  return count;
}

/** The graph with every node where the layout put it. */
export function applyLayout<D>(graph: FlowGraph<D>, layout: LayoutResult): FlowGraph<D> {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      const p = layout.positions.get(node.id);
      return p && (p.x !== node.position.x || p.y !== node.position.y)
        ? { ...node, position: p }
        : node;
    }),
  };
}
