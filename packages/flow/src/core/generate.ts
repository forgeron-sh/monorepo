// A large flow made up from a seed, for benchmarks, stress demos and tests: hops forward like a
// real automation, a branch now and then, and merges. No loop: every edge goes from
// an earlier node to a later one. The same seed always gives the same graph.

import type { FlowEdge, FlowGraph, FlowNode } from "./model";
import { FLOW_FORMAT_VERSION } from "./model";

export interface GenerateOptions {
  nodes: number;
  edges: number;
  seed?: number;
  /** The size of every node; 240 × 80 by default. */
  size?: { w: number; h: number };
}

/** mulberry32: a small seeded generator, enough for test data. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateFlowGraph({
  nodes: count,
  edges: wanted,
  seed = 1,
  size = { w: 240, h: 80 },
}: GenerateOptions): FlowGraph<{ title: string }> {
  const rand = random(seed);
  const nodes: FlowNode<{ title: string }>[] = [];
  for (let i = 0; i < count; i++) {
    const branch = i > 0 && rand() < 0.12;
    nodes.push({
      id: `n${i}`,
      type: i === 0 ? "trigger" : branch ? "if" : "action",
      position: { x: (i % 25) * 300, y: Math.floor(i / 25) * 120 },
      size,
      inputs: i === 0 ? [] : [{ id: "in", multiple: true }],
      outputs: branch
        ? [
            { id: "true", label: "true" },
            { id: "false", label: "false" },
          ]
        : [{ id: "out" }],
      data: { title: `Step ${i}` },
    });
  }
  const edges: FlowEdge[] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const from = nodes[a]!;
    const port = from.outputs[Math.floor(rand() * from.outputs.length)]!.id;
    const key = `${a}:${port}>${b}`;
    if (seen.has(key)) return false;
    seen.add(key);
    edges.push({
      id: `e${edges.length}`,
      from: { node: from.id, port },
      to: { node: nodes[b]!.id, port: "in" },
    });
    return true;
  };
  // A spanning tree: each node fed by one of the 40 before it, so the flow spreads (some 50 layers
  // of about 10 nodes for 500) rather than running as one long chain.
  for (let i = 1; i < count && edges.length < wanted; i++) {
    add(Math.max(0, i - 1 - Math.floor(rand() * Math.min(i, 40))), i);
  }
  let tries = 0;
  while (edges.length < wanted && tries++ < wanted * 20 && count > 1) {
    const a = Math.floor(rand() * (count - 1));
    const b = Math.min(count - 1, a + 1 + Math.floor(rand() * 12));
    add(a, b);
  }
  return { version: FLOW_FORMAT_VERSION, nodes, edges, groups: [] };
}
