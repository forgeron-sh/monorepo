// A flow on the canvas engine. Each node is one canvas item of kind `flow-node`; its data carries
// the node's ports and data, the edges that leave it and its group. So every edit (a connection, a
// deleted edge, a renamed group) is a change of items, recorded by the engine's history: undo and
// redo need nothing of their own. The graph is read back from the items, edges to a node that is
// gone are left out.

import type { Item, KindMap } from "@forgeron/canvas";
import {
  FLOW_FORMAT_VERSION,
  portOf,
  type FlowEdge,
  type FlowGraph,
  type FlowGroup,
  type FlowNode,
  type FlowPort,
} from "./model";

export const NODE_KIND = "flow-node";

export interface FlowItemData<D = unknown> {
  type: string;
  inputs: FlowPort[];
  outputs: FlowPort[];
  data: D;
  /** The edges that leave this node. */
  out: FlowEdge[];
  group?: { id: string; label: string };
}

export type FlowItem<D = unknown> = Item<FlowItemData<D>>;

/** The kinds a flow canvas is created with: a node keeps its size and is not resized by hand. */
export const flowKinds = <D>(): KindMap<FlowItemData<D>> => ({
  [NODE_KIND]: {
    resize: false,
    // A copy made by the engine itself (not by the flow's own duplicate) starts unconnected.
    duplicate: (item, id) => {
      const { group: _group, ...data } = item.data;
      return {
        ...item,
        id,
        bounds: { ...item.bounds, x: item.bounds.x + 20, y: item.bounds.y + 20 },
        data: { ...data, out: [] },
      };
    },
  },
});

export const isNodeItem = <D>(item: Item<unknown>): item is FlowItem<D> => item.kind === NODE_KIND;

export function nodeOfItem<D>(item: FlowItem<D>): FlowNode<D> {
  const { x, y, w, h } = item.bounds;
  return {
    id: item.id,
    type: item.data.type,
    position: { x, y },
    size: { w, h },
    inputs: item.data.inputs,
    outputs: item.data.outputs,
    data: item.data.data,
  };
}

/** The items of a graph, nodes in document order, bottom first. */
export function graphToItems<D>(graph: FlowGraph<D>): FlowItem<D>[] {
  const out = new Map<string, FlowEdge[]>();
  for (const e of graph.edges) {
    const list = out.get(e.from.node);
    if (list) list.push(e);
    else out.set(e.from.node, [e]);
  }
  const group = new Map<string, FlowGroup>();
  for (const g of graph.groups) for (const id of g.nodes) group.set(id, g);
  return graph.nodes.map((n, z) => {
    const g = group.get(n.id);
    const data: FlowItemData<D> = {
      type: n.type,
      inputs: n.inputs,
      outputs: n.outputs,
      data: n.data,
      out: out.get(n.id) ?? [],
    };
    if (g) data.group = { id: g.id, label: g.label };
    return {
      id: n.id,
      kind: NODE_KIND,
      bounds: { x: n.position.x, y: n.position.y, w: n.size.w, h: n.size.h },
      z,
      data,
    };
  });
}

/**
 * The graph the items hold. Nodes come in stacking order, edges by their source; an edge whose
 * target or port is gone is left out, as is a second edge with an id already met.
 */
export function itemsToGraph<D>(items: ReadonlyArray<Item<unknown>>): FlowGraph<D> {
  const nodeItems = items.filter((i): i is FlowItem<D> => isNodeItem<D>(i));
  const nodes = nodeItems.map((i) => nodeOfItem(i));
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const edges: FlowEdge[] = [];
  const seen = new Set<string>(nodes.map((n) => n.id));
  const groups = new Map<string, FlowGroup>();
  for (const item of nodeItems) {
    const source = byId.get(item.id)!;
    for (const e of item.data.out) {
      const target = byId.get(e.to.node);
      if (
        e.from.node !== item.id ||
        !target ||
        !portOf(source, "out", e.from.port) ||
        !portOf(target, "in", e.to.port) ||
        seen.has(e.id)
      )
        continue;
      seen.add(e.id);
      edges.push(e);
    }
    const g = item.data.group;
    if (g) {
      const known = groups.get(g.id);
      if (known) known.nodes.push(item.id);
      else groups.set(g.id, { id: g.id, label: g.label, nodes: [item.id] });
    }
  }
  return { version: FLOW_FORMAT_VERSION, nodes, edges, groups: [...groups.values()] };
}
