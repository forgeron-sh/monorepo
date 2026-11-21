// The edits of a flow graph that need no rule: each is a pure function that returns a new graph
// and leaves the one it was given untouched. What connects, groups or copies on top of them is
// brought by plugins; this file imports no registry, so the plugins can use it.

import { idsOf, indexGraph, nextId, type FlowGraph, type FlowNode } from "./model";
import type { LayoutResult } from "./plugin";

export function addNodes<D>(graph: FlowGraph<D>, nodes: ReadonlyArray<FlowNode<D>>): FlowGraph<D> {
  const taken = idsOf(graph);
  for (const n of nodes) {
    if (taken.has(n.id)) throw new Error(`addNodes: the id "${n.id}" is taken.`);
    taken.add(n.id);
  }
  return { ...graph, nodes: [...graph.nodes, ...nodes] };
}

/** Without these nodes, their edges, and their place in groups (a group left empty goes too). */
export function removeNodes<D>(graph: FlowGraph<D>, ids: Iterable<string>): FlowGraph<D> {
  const gone = new Set(ids);
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !gone.has(n.id)),
    edges: graph.edges.filter((e) => !gone.has(e.from.node) && !gone.has(e.to.node)),
    groups: graph.groups
      .map((g) => ({ ...g, nodes: g.nodes.filter((id) => !gone.has(id)) }))
      .filter((g) => g.nodes.length > 0),
  };
}

export function removeEdges<D>(graph: FlowGraph<D>, ids: Iterable<string>): FlowGraph<D> {
  const gone = new Set(ids);
  return { ...graph, edges: graph.edges.filter((e) => !gone.has(e.id)) };
}

/** A copy with fields of one node replaced. */
export function updateNode<D>(
  graph: FlowGraph<D>,
  id: string,
  patch: Partial<Omit<FlowNode<D>, "id">>,
): FlowGraph<D> {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) };
}

/* ---------------------------------------------------------------- Copy and paste */

/** The nodes, the edges between them and the groups wholly inside: what a copy carries. */
export function extractSubgraph<D>(graph: FlowGraph<D>, ids: Iterable<string>): FlowGraph<D> {
  const keep = new Set(ids);
  return {
    version: graph.version,
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    edges: graph.edges.filter((e) => keep.has(e.from.node) && keep.has(e.to.node)),
    groups: graph.groups.filter((g) => g.nodes.every((n) => keep.has(n))),
  };
}

/**
 * Adds a copy of `fragment` (from `extractSubgraph`, or pasted JSON) under new ids, moved by
 * `offset`. Edges and groups follow their nodes. Gives the new graph and the ids, old to new.
 */
export function pasteSubgraph<D>(
  graph: FlowGraph<D>,
  fragment: FlowGraph<D>,
  offset: { x: number; y: number },
  prefix = (node: FlowNode<D>) => node.type || "node",
): { graph: FlowGraph<D>; ids: Map<string, string> } {
  const taken = idsOf(graph);
  const ids = new Map<string, string>();
  const take = (old: string, p: string) => {
    const id = nextId(p, taken);
    taken.add(id);
    ids.set(old, id);
    return id;
  };
  const nodes = fragment.nodes.map((n) => ({
    ...n,
    id: take(n.id, prefix(n)),
    position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
  }));
  const edges = fragment.edges
    .filter((e) => ids.has(e.from.node) && ids.has(e.to.node))
    .map((e) => ({
      id: take(`edge:${e.id}`, "edge"),
      from: { node: ids.get(e.from.node)!, port: e.from.port },
      to: { node: ids.get(e.to.node)!, port: e.to.port },
    }));
  const groups = fragment.groups
    .map((g) => ({
      id: take(`group:${g.id}`, "group"),
      label: g.label,
      nodes: g.nodes.filter((n) => ids.has(n)).map((n) => ids.get(n)!),
    }))
    .filter((g) => g.nodes.length > 0);
  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, ...nodes],
      edges: [...graph.edges, ...edges],
      groups: [...graph.groups, ...groups],
    },
    ids,
  };
}

/* ---------------------------------------------------------------- Order */

/**
 * The nodes in an order where every edge goes forward (Kahn's algorithm, ties in document order).
 * Nodes on a loop, which have no such place, come last in document order.
 */
export function topologicalOrder<D>(graph: FlowGraph<D>): string[] {
  const index = indexGraph(graph);
  const pending = new Map(graph.nodes.map((n) => [n.id, index.in.get(n.id)!.length] as const));
  const order: string[] = [];
  const position = new Map(graph.nodes.map((n, i) => [n.id, i] as const));
  let ready = graph.nodes.filter((n) => pending.get(n.id) === 0).map((n) => n.id);
  while (ready.length) {
    const next: string[] = [];
    for (const id of ready) {
      order.push(id);
      for (const e of index.out.get(id)!) {
        const left = pending.get(e.to.node)! - 1;
        pending.set(e.to.node, left);
        if (left === 0) next.push(e.to.node);
      }
    }
    ready = next.sort((a, b) => position.get(a)! - position.get(b)!);
  }
  if (order.length < graph.nodes.length) {
    const done = new Set(order);
    for (const n of graph.nodes) if (!done.has(n.id)) order.push(n.id);
  }
  return order;
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
