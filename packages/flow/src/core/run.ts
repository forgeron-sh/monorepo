// Run state: where each node and edge stands while a flow runs, to show a run (or a test) on the
// canvas. `planRun` turns a graph and the outcome of each node into the frames of a run, wave by
// wave: the nodes whose inputs are settled run together, then their outputs carry on. A node no
// edge reaches is skipped, and so is everything after an error.

import { indexGraph, type FlowGraph, type FlowNode } from "./model";

export type RunStatus = "idle" | "running" | "success" | "error" | "skipped";

export interface RunState {
  nodes: Readonly<Record<string, RunStatus>>;
  edges: Readonly<Record<string, RunStatus>>;
}

export const IDLE_RUN: RunState = { nodes: {}, edges: {} };

export const nodeStatus = (run: RunState | undefined, id: string): RunStatus =>
  run?.nodes[id] ?? "idle";
export const edgeStatus = (run: RunState | undefined, id: string): RunStatus =>
  run?.edges[id] ?? "idle";

/** What one node did: succeeded through some of its outputs (all by default), or failed. */
export type NodeOutcome =
  | { status: "success"; ports?: ReadonlyArray<string> }
  | { status: "error" };

/**
 * The frames of a run, the last one final. Edges carry `running` while items flow on them and
 * `success` once their target took them; an output that did not fire leaves `skipped` edges.
 */
export function planRun<D>(
  graph: FlowGraph<D>,
  decide: (node: FlowNode<D>) => NodeOutcome = () => ({ status: "success" }),
): RunState[] {
  const index = indexGraph(graph);
  const nodes: Record<string, RunStatus> = {};
  const edges: Record<string, RunStatus> = {};
  const frames: RunState[] = [];
  const snap = () => frames.push({ nodes: { ...nodes }, edges: { ...edges } });
  const settled = (id: string) =>
    index.in.get(id)!.every((e) => edges[e.id] === "running" || edges[e.id] === "skipped");
  const reached = (id: string) => {
    const into = index.in.get(id)!;
    return into.length === 0 || into.some((e) => edges[e.id] === "running");
  };
  const done = new Set<string>();
  let wave = graph.nodes.filter((n) => index.in.get(n.id)!.length === 0);
  while (wave.length) {
    const run = wave.filter((n) => reached(n.id));
    const skip = wave.filter((n) => !reached(n.id));
    for (const n of wave) {
      done.add(n.id);
      for (const e of index.in.get(n.id)!) if (edges[e.id] === "running") edges[e.id] = "success";
    }
    for (const n of skip) {
      nodes[n.id] = "skipped";
      for (const e of index.out.get(n.id)!) edges[e.id] = "skipped";
    }
    if (run.length) {
      for (const n of run) nodes[n.id] = "running";
      snap();
      for (const n of run) {
        const outcome = decide(n);
        nodes[n.id] = outcome.status;
        const fired = outcome.status === "success" ? outcome.ports : [];
        for (const e of index.out.get(n.id)!) {
          const on = fired === undefined || fired.includes(e.from.port);
          edges[e.id] = on ? "running" : "skipped";
        }
      }
      snap();
    }
    const next = new Set<string>();
    for (const n of wave) {
      for (const e of index.out.get(n.id)!) {
        const t = e.to.node;
        if (!done.has(t) && settled(t)) next.add(t);
      }
    }
    wave = graph.nodes.filter((n) => next.has(n.id));
  }
  // What no wave reached (a loop) is skipped; the last edges into the end are taken.
  for (const n of graph.nodes) if (!done.has(n.id)) nodes[n.id] = "skipped";
  for (const e of graph.edges) {
    if (edges[e.id] === "running") edges[e.id] = "success";
    edges[e.id] ??= "skipped";
  }
  snap();
  return frames;
}

/** How many nodes stand in each state. */
export function countStatuses(run: RunState, ids: Iterable<string>): Record<RunStatus, number> {
  const out: Record<RunStatus, number> = { idle: 0, running: 0, success: 0, error: 0, skipped: 0 };
  for (const id of ids) out[nodeStatus(run, id)]++;
  return out;
}
