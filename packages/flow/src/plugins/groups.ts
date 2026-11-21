// Groups as a plugin: a labelled frame around nodes, a node in one group at most. The groups are
// data of the document (`FlowGraph.groups`, in the JSON whatever the plugins), the frame is derived
// from the nodes each time: this file knows how to make and dissolve a group and how big its frame
// is. Without it a graph keeps its groups and no editor draws them.

import type { Bounds } from "@forgeron/canvas";
import { idsOf, nextId, type FlowGraph, type FlowGroup, type GraphIndex } from "../core/model";
import { definePlugin } from "../core/plugin";

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

/** The frame of a group: its nodes' bounds plus a margin, with room for the label on top. */
export function groupBounds<D>(
  index: GraphIndex<D>,
  nodes: ReadonlyArray<string>,
  padding = 20,
  label = 20,
): Bounds | null {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const id of nodes) {
    const n = index.nodes.get(id);
    if (!n) continue;
    x1 = Math.min(x1, n.position.x);
    y1 = Math.min(y1, n.position.y);
    x2 = Math.max(x2, n.position.x + n.size.w);
    y2 = Math.max(y2, n.position.y + n.size.h);
  }
  if (x1 === Infinity) return null;
  return {
    x: x1 - padding,
    y: y1 - padding - label,
    w: x2 - x1 + padding * 2,
    h: y2 - y1 + padding * 2 + label,
  };
}

export const groups = definePlugin({
  id: "groups",
  name: "Groups",
  description:
    "Labelled frames around nodes, computed from the nodes: group the selection, dissolve a group, select a group by its label.",
  groups: { group: groupNodes, ungroup, bounds: groupBounds },
});
