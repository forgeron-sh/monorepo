// The model of a flow: a graph document of nodes with typed ports, edges between ports, and groups.
// Plain data, no React and no DOM. Every coordinate is in world units, as on the canvas.

import type { Point, Size } from "@forgeron/canvas";

export const FLOW_FORMAT_VERSION = 1;

/** The data type of a port when it says none: connects to anything. */
export const ANY = "any";

export interface FlowPort {
  /** Unique among the inputs, or among the outputs, of its node: `in`, `true`, `false`. */
  id: string;
  /** Shown next to the port when a node has several on one side. */
  label?: string;
  /** What travels through it: `items`, `boolean`, `any` (default). */
  type?: string;
  /**
   * An input takes one edge unless `multiple` is set (a merge); an output fans out to any number
   * unless `multiple` is `false`.
   */
  multiple?: boolean;
}

export interface FlowNode<D = unknown> {
  id: string;
  /** The consumer's kind of node: `trigger`, `action`, `if`. */
  type: string;
  /** The top-left corner. */
  position: Point;
  size: Size;
  inputs: FlowPort[];
  outputs: FlowPort[];
  /** The consumer's, passed through untouched (must survive JSON). */
  data: D;
}

/** One end of an edge: a node and one of its ports. */
export interface PortRef {
  node: string;
  port: string;
}

/** Always from an output to an input. */
export interface FlowEdge {
  id: string;
  from: PortRef;
  to: PortRef;
}

/** A labelled frame around nodes; a node is in one group at most. */
export interface FlowGroup {
  id: string;
  label: string;
  nodes: string[];
}

export interface FlowGraph<D = unknown> {
  version: typeof FLOW_FORMAT_VERSION;
  nodes: FlowNode<D>[];
  edges: FlowEdge[];
  groups: FlowGroup[];
}

export type PortSide = "in" | "out";

export const emptyGraph = <D = unknown>(): FlowGraph<D> => ({
  version: FLOW_FORMAT_VERSION,
  nodes: [],
  edges: [],
  groups: [],
});

/** Lookups over a graph: nodes by id, edges by node. Build once per graph, read many times. */
export interface GraphIndex<D = unknown> {
  nodes: Map<string, FlowNode<D>>;
  /** The edges leaving each node, in document order. */
  out: Map<string, FlowEdge[]>;
  /** The edges entering each node, in document order. */
  in: Map<string, FlowEdge[]>;
}

const indexes = new WeakMap<FlowGraph<unknown>, GraphIndex<unknown>>();

/**
 * The nodes by id and the edges in and out of each node. Kept per graph object (graphs are never
 * changed in place): the editor's layers ask for the same graph's index several times a change.
 */
export function indexGraph<D>(graph: FlowGraph<D>): GraphIndex<D> {
  const known = indexes.get(graph as FlowGraph<unknown>);
  if (known) return known as GraphIndex<D>;
  const made = reindex(graph, last as { graph: FlowGraph<D>; index: GraphIndex<D> } | null);
  indexes.set(graph as FlowGraph<unknown>, made as GraphIndex<unknown>);
  last = { graph: graph as FlowGraph<unknown>, index: made as GraphIndex<unknown> };
  return made;
}

/** The graph indexed last: the next one is often it with nodes moved (a drag). */
let last: { graph: FlowGraph<unknown>; index: GraphIndex<unknown> } | null = null;

/**
 * The index of `graph` from the last one when they share their edges and their nodes' ids in
 * order (only nodes changed: a drag): the edges by node are that index's, the nodes are read
 * again.
 */
function reindex<D>(
  graph: FlowGraph<D>,
  prev: { graph: FlowGraph<D>; index: GraphIndex<D> } | null,
): GraphIndex<D> {
  const was = prev?.graph;
  if (!prev || !was || was.edges !== graph.edges || was.nodes.length !== graph.nodes.length) {
    return buildIndex(graph);
  }
  const nodes = new Map<string, FlowNode<D>>();
  for (let i = 0; i < graph.nodes.length; i++) {
    const n = graph.nodes[i]!;
    if (n.id !== was.nodes[i]!.id) return buildIndex(graph);
    nodes.set(n.id, n);
  }
  return { nodes, out: prev.index.out, in: prev.index.in };
}

function buildIndex<D>(graph: FlowGraph<D>): GraphIndex<D> {
  const nodes = new Map(graph.nodes.map((n) => [n.id, n] as const));
  const out = new Map<string, FlowEdge[]>();
  const into = new Map<string, FlowEdge[]>();
  for (const n of graph.nodes) {
    out.set(n.id, []);
    into.set(n.id, []);
  }
  for (const e of graph.edges) {
    out.get(e.from.node)?.push(e);
    into.get(e.to.node)?.push(e);
  }
  return { nodes, out, in: into };
}

export const portOf = <D>(node: FlowNode<D>, side: PortSide, id: string): FlowPort | undefined =>
  (side === "in" ? node.inputs : node.outputs).find((p) => p.id === id);

/** `<prefix>-<n>` with the smallest n not taken: ids are never random. */
export function nextId(prefix: string, taken: ReadonlySet<string>): string {
  let n = 1;
  while (taken.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/** Every id of the graph: nodes, edges and groups share one namespace for new ids. */
export const idsOf = <D>(graph: FlowGraph<D>): Set<string> =>
  new Set([
    ...graph.nodes.map((n) => n.id),
    ...graph.edges.map((e) => e.id),
    ...graph.groups.map((g) => g.id),
  ]);

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
