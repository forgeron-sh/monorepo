// Edits of a flow graph as pure functions: each returns a new graph and leaves the one it was given
// untouched. Connecting goes through `checkConnection`, which says why a connection is refused:
// a missing port, the wrong direction, two types that do not match, an input already taken, a
// cycle when cycles are forbidden.

import {
  ANY,
  idsOf,
  indexGraph,
  nextId,
  portOf,
  type FlowEdge,
  type FlowGraph,
  type FlowGroup,
  type FlowNode,
  type FlowPort,
  type GraphIndex,
  type PortRef,
} from "./model";

export interface ConnectOptions {
  /** `forbid` (default): an edge that closes a loop is refused. `allow`: loops are drawn. */
  cycles?: "forbid" | "allow";
  /** Whether an output of type `from` may feed an input of type `to`. Equal types, or `any`. */
  compatible?: (from: string, to: string) => boolean;
}

export type ConnectError =
  | "missing-node"
  | "missing-port"
  | "same-node"
  | "type"
  | "duplicate"
  | "occupied"
  | "fan-out"
  | "cycle";

const defaultCompatible = (a: string, b: string) => a === b || a === ANY || b === ANY;

/** Whether a path of edges leads from `start` to `goal`. */
export function reaches<D>(index: GraphIndex<D>, start: string, goal: string): boolean {
  if (start === goal) return true;
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const id = stack.pop()!;
    for (const e of index.out.get(id) ?? []) {
      const next = e.to.node;
      if (next === goal) return true;
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return false;
}

/**
 * Why an edge from an output to an input would be refused, or null when it may be made. `ignore`
 * leaves an edge out of the count (the one being reconnected).
 */
export function checkConnection<D>(
  graph: FlowGraph<D>,
  from: PortRef,
  to: PortRef,
  options: ConnectOptions = {},
  ignore?: string,
  index: GraphIndex<D> = indexGraph(
    ignore ? { ...graph, edges: graph.edges.filter((e) => e.id !== ignore) } : graph,
  ),
): ConnectError | null {
  const source = index.nodes.get(from.node);
  const target = index.nodes.get(to.node);
  if (!source || !target) return "missing-node";
  if (source.id === target.id) return "same-node";
  const out = portOf(source, "out", from.port);
  const input = portOf(target, "in", to.port);
  if (!out || !input) return "missing-port";
  const compatible = options.compatible ?? defaultCompatible;
  if (!compatible(out.type ?? ANY, input.type ?? ANY)) return "type";
  const leaving = (index.out.get(source.id) ?? []).filter((e) => e.from.port === out.id);
  if (leaving.some((e) => e.to.node === target.id && e.to.port === input.id)) return "duplicate";
  if (out.multiple === false && leaving.length > 0) return "fan-out";
  const entering = (index.in.get(target.id) ?? []).filter((e) => e.to.port === input.id);
  if (!input.multiple && entering.length > 0) return "occupied";
  if ((options.cycles ?? "forbid") === "forbid" && reaches(index, target.id, source.id))
    return "cycle";
  return null;
}

export const canConnect = <D>(
  graph: FlowGraph<D>,
  from: PortRef,
  to: PortRef,
  options?: ConnectOptions,
): boolean => checkConnection(graph, from, to, options) === null;

export type ConnectResult<D> =
  | { ok: true; graph: FlowGraph<D>; edge: FlowEdge }
  | { ok: false; error: ConnectError };

/** Adds an edge from an output to an input, when the rules allow it. */
export function connect<D>(
  graph: FlowGraph<D>,
  from: PortRef,
  to: PortRef,
  options?: ConnectOptions & { id?: string },
): ConnectResult<D> {
  const error = checkConnection(graph, from, to, options);
  if (error) return { ok: false, error };
  const edge: FlowEdge = { id: options?.id ?? nextId("edge", idsOf(graph)), from, to };
  return { ok: true, graph: { ...graph, edges: [...graph.edges, edge] }, edge };
}

/**
 * The input of `target` an edge from `from` would land on when it is dropped on the node rather
 * than on a port: the first free input that accepts it.
 */
export function inputFor<D>(
  graph: FlowGraph<D>,
  from: PortRef,
  target: string,
  options?: ConnectOptions,
): PortRef | null {
  const node = graph.nodes.find((n) => n.id === target);
  if (!node) return null;
  const index = indexGraph(graph);
  for (const p of node.inputs) {
    const to = { node: target, port: p.id };
    if (checkConnection(graph, from, to, options, undefined, index) === null) return to;
  }
  return null;
}

/** The output of `source` an edge to `to` would leave from, when dropped on the node. */
export function outputFor<D>(
  graph: FlowGraph<D>,
  source: string,
  to: PortRef,
  options?: ConnectOptions,
): PortRef | null {
  const node = graph.nodes.find((n) => n.id === source);
  if (!node) return null;
  const index = indexGraph(graph);
  for (const p of node.outputs) {
    const from = { node: source, port: p.id };
    if (checkConnection(graph, from, to, options, undefined, index) === null) return from;
  }
  return null;
}

/** Moves one end of an edge to another port, when the rules allow it. */
export function reconnect<D>(
  graph: FlowGraph<D>,
  edgeId: string,
  end: "from" | "to",
  ref: PortRef,
  options?: ConnectOptions,
): ConnectResult<D> {
  const edge = graph.edges.find((e) => e.id === edgeId);
  if (!edge) return { ok: false, error: "missing-node" };
  const next: FlowEdge = { ...edge, [end]: ref };
  const error = checkConnection(graph, next.from, next.to, options, edgeId);
  if (error) return { ok: false, error };
  return {
    ok: true,
    graph: { ...graph, edges: graph.edges.map((e) => (e.id === edgeId ? next : e)) },
    edge: next,
  };
}

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

const firstCompatible = (
  outs: ReadonlyArray<FlowPort>,
  ins: ReadonlyArray<FlowPort>,
  compatible: (a: string, b: string) => boolean,
) => {
  for (const o of outs) {
    for (const i of ins) if (compatible(o.type ?? ANY, i.type ?? ANY)) return [o, i] as const;
  }
  return null;
};

/**
 * Puts a node in the middle of an edge: the edge's source feeds the node's first input that takes
 * it, and the node's first output that fits feeds the edge's target. The node keeps the edge's id
 * on its way in. Refused when the node has no fitting ports.
 */
export function insertOnEdge<D>(
  graph: FlowGraph<D>,
  edgeId: string,
  node: FlowNode<D>,
  options: ConnectOptions = {},
): ConnectResult<D> & { edges?: [FlowEdge, FlowEdge] } {
  const edge = graph.edges.find((e) => e.id === edgeId);
  if (!edge) return { ok: false, error: "missing-node" };
  const index = indexGraph(graph);
  const source = index.nodes.get(edge.from.node);
  const target = index.nodes.get(edge.to.node);
  const outPort = source && portOf(source, "out", edge.from.port);
  const inPort = target && portOf(target, "in", edge.to.port);
  if (!outPort || !inPort) return { ok: false, error: "missing-port" };
  const compatible = options.compatible ?? defaultCompatible;
  const enter = firstCompatible([outPort], node.inputs, compatible);
  const leave = firstCompatible(node.outputs, [inPort], compatible);
  if (!enter || !leave) return { ok: false, error: "type" };
  const withNode = addNodes(removeEdges(graph, [edgeId]), [node]);
  const taken = idsOf(withNode);
  taken.add(edgeId);
  const a: FlowEdge = { id: edgeId, from: edge.from, to: { node: node.id, port: enter[1].id } };
  const b: FlowEdge = {
    id: nextId("edge", taken),
    from: { node: node.id, port: leave[0].id },
    to: edge.to,
  };
  const next = { ...withNode, edges: [...withNode.edges, a, b] };
  return { ok: true, graph: next, edge: a, edges: [a, b] };
}

/* ---------------------------------------------------------------- Groups */

/** Puts nodes in a new group, taking them out of the one they were in. */
export function groupNodes<D>(
  graph: FlowGraph<D>,
  ids: Iterable<string>,
  label: string,
  id = nextId("group", idsOf(graph)),
): FlowGraph<D> {
  const known = new Set(graph.nodes.map((n) => n.id));
  const members = [...new Set(ids)].filter((n) => known.has(n));
  if (members.length === 0) return graph;
  const taken = new Set(members);
  const groups: FlowGroup[] = graph.groups
    .map((g) => ({ ...g, nodes: g.nodes.filter((n) => !taken.has(n)) }))
    .filter((g) => g.nodes.length > 0);
  return { ...graph, groups: [...groups, { id, label, nodes: members }] };
}

export function ungroup<D>(graph: FlowGraph<D>, groupId: string): FlowGraph<D> {
  return { ...graph, groups: graph.groups.filter((g) => g.id !== groupId) };
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
