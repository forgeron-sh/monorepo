// Edits of a flow graph as pure functions: each returns a new graph and leaves the one it was given
// untouched. Connecting goes through `checkConnection`, which asks the connection rules of the
// plugins in force and gives the reason of the first that refuses: with the `full` preset a missing
// port, two types that do not match, an input already taken, a cycle; with the minimal core alone,
// nothing but a missing node or port.

import { registryOrDefault } from "./defaults";
import {
  addNodes,
  extractSubgraph,
  pasteSubgraph,
  removeEdges,
  removeNodes,
  topologicalOrder,
  updateNode,
} from "./edit";
import {
  idsOf,
  indexGraph,
  nextId,
  portOf,
  reaches,
  type FlowEdge,
  type FlowGraph,
  type FlowNode,
  type FlowPort,
  type GraphIndex,
  type PortRef,
} from "./model";
import type { ConnectOptions } from "./plugin";

export type { ConnectOptions };
export {
  addNodes,
  extractSubgraph,
  pasteSubgraph,
  reaches,
  removeEdges,
  removeNodes,
  topologicalOrder,
  updateNode,
};

/**
 * Why a connection is refused: `missing-node` and `missing-port` from the core, then the reason of
 * the rule that refused (`same-node`, `type`, `duplicate`, `fan-out`, `occupied`, `cycle` for the
 * bundled ones; a plugin's own for its own).
 */
export type ConnectError =
  | "missing-node"
  | "missing-port"
  | "same-node"
  | "type"
  | "duplicate"
  | "occupied"
  | "fan-out"
  | "cycle"
  | (string & {});

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
  const out = portOf(source, "out", from.port);
  const input = portOf(target, "in", to.port);
  if (!out || !input) return "missing-port";
  const registry = registryOrDefault(options.plugins);
  if (registry.rules.length === 0) return null;
  const ctx = {
    graph,
    index,
    from,
    to,
    source,
    target,
    out,
    input,
    leaving: (index.out.get(source.id) ?? []).filter((e) => e.from.port === out.id),
    entering: (index.in.get(target.id) ?? []).filter((e) => e.to.port === input.id),
    options,
    registry,
  };
  for (const rule of registry.rules) {
    const why = rule.check(ctx as never);
    if (why) return why;
  }
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

const firstMatch = (
  outs: ReadonlyArray<FlowPort>,
  ins: ReadonlyArray<FlowPort>,
  matches: (out: FlowPort, input: FlowPort) => boolean,
) => {
  for (const o of outs) {
    for (const i of ins) if (matches(o, i)) return [o, i] as const;
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
  const registry = registryOrDefault(options.plugins);
  const matches = (o: FlowPort, i: FlowPort) => registry.matches(o, i, options);
  const enter = firstMatch([outPort], node.inputs, matches);
  const leave = firstMatch(node.outputs, [inPort], matches);
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
