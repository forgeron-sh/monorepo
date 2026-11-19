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
  /** The node, or null for a virtual node of a long edge. */
  node: string | null;
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

export function layoutGraph<D>(graph: FlowGraph<D>, options: LayoutOptions = {}): LayoutResult {
  const {
    layerGap = 80,
    nodeGap = 40,
    edgeGap = 20,
    grid = 20,
    sweeps = 12,
    passes = 8,
    origin = { x: 0, y: 0 },
  } = options;
  const nodes = graph.nodes;
  const n = nodes.length;
  const at = new Map(nodes.map((node, i) => [node.id, i] as const));

  /* ---- 1. edges between known nodes, back edges turned around */

  interface Link {
    id: string;
    a: number;
    b: number;
    oa: number;
    ob: number;
  }
  const outs: Link[][] = nodes.map(() => []);
  for (const e of graph.edges) {
    const a = at.get(e.from.node);
    const b = at.get(e.to.node);
    if (a === undefined || b === undefined || a === b) continue;
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
    outs[a]!.push({
      id: e.id,
      a,
      b,
      oa: portOffset(src.size.h, oi, Math.max(1, src.outputs.length)),
      ob: portOffset(dst.size.h, ii, Math.max(1, dst.inputs.length)),
    });
  }
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

  const succ: number[][] = nodes.map(() => []);
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

  const verts: Vertex[] = nodes.map((node, i) => ({
    node: node.id,
    w: node.size.w,
    h: node.size.h,
    layer: layer[i]!,
  }));
  const segs: Segment[] = [];
  for (const l of links) {
    let u = l.a;
    let ou = l.oa;
    for (let k = layer[l.a]! + 1; k < layer[l.b]!; k++) {
      const d = verts.push({ node: null, w: 0, h: 0, layer: k }) - 1;
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
    verts[a]!.node === null || verts[b]!.node === null ? edgeGap : nodeGap;
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

  const snapUp = (v: number) => (grid > 0 ? Math.ceil(v / grid - 1e-9) * grid : v);
  const snapNear = (v: number) => (grid > 0 ? Math.round(v / grid) * grid : v);
  let top = Infinity;
  for (let v = 0; v < n; v++) top = Math.min(top, y[v]!);
  if (top === Infinity) top = 0;
  const positions = new Map<string, Point>();
  const out: string[][] = [];
  let x = snapNear(origin.x);
  for (let k = 0; k < L; k++) {
    const list = layers[k]!;
    let prevBottom = -Infinity;
    let width = 0;
    const real: string[] = [];
    for (const v of list) {
      const vert = verts[v]!;
      if (vert.node === null) continue;
      let yy = snapNear(y[v]! - top + origin.y);
      if (yy < prevBottom + nodeGap) yy = snapUp(prevBottom + nodeGap);
      positions.set(vert.node, { x, y: yy });
      prevBottom = yy + vert.h;
      width = Math.max(width, vert.w);
      real.push(vert.node);
    }
    out.push(real);
    x = snapUp(x + width + layerGap);
  }
  return { positions, layers: out, crossings: bestCount, reversed };
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
