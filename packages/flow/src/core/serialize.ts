// A flow as JSON: `{ "version": 1, "nodes": [...], "edges": [...], "groups": [...] }`. Reading
// checks the version, the shape of every node, that ids are unique, that each edge joins an output
// to an input that exist, and that a node is in one group at most; it fails loudly otherwise.

import {
  FLOW_FORMAT_VERSION,
  portOf,
  type FlowEdge,
  type FlowGraph,
  type FlowGroup,
  type FlowNode,
  type FlowPort,
} from "./model";
import { registryOf, type Plugins } from "./plugin";

export class FlowFormatError extends Error {
  override name = "FlowFormatError";
}

export function serializeFlow<D>(graph: FlowGraph<D>, space?: number): string {
  const doc: FlowGraph<D> = {
    version: FLOW_FORMAT_VERSION,
    nodes: graph.nodes,
    edges: graph.edges,
    groups: graph.groups,
  };
  return JSON.stringify(doc, null, space);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0;

function readPorts(raw: unknown, where: string): FlowPort[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new FlowFormatError(`${where} is not a list.`);
  const seen = new Set<string>();
  return raw.map((p, i) => {
    if (!isObject(p) || !isId(p.id)) throw new FlowFormatError(`${where}[${i}].id is missing.`);
    if (seen.has(p.id)) throw new FlowFormatError(`${where}: the port "${p.id}" is twice.`);
    seen.add(p.id);
    const port: FlowPort = { id: p.id };
    if (typeof p.label === "string") port.label = p.label;
    if (typeof p.type === "string") port.type = p.type;
    if (typeof p.multiple === "boolean") port.multiple = p.multiple;
    return port;
  });
}

function readNode(raw: unknown, i: number): FlowNode {
  const where = `nodes[${i}]`;
  if (!isObject(raw)) throw new FlowFormatError(`${where} is not an object.`);
  const { id, type, position, size, inputs, outputs, data } = raw;
  if (!isId(id)) throw new FlowFormatError(`${where}.id is missing.`);
  if (typeof type !== "string") throw new FlowFormatError(`${where}.type is missing.`);
  if (!isObject(position) || !isNumber(position.x) || !isNumber(position.y))
    throw new FlowFormatError(`${where}.position must hold x and y.`);
  if (!isObject(size) || !isNumber(size.w) || !isNumber(size.h) || size.w <= 0 || size.h <= 0)
    throw new FlowFormatError(`${where}.size must hold a positive w and h.`);
  return {
    id,
    type,
    position: { x: position.x, y: position.y },
    size: { w: size.w, h: size.h },
    inputs: readPorts(inputs, `${where}.inputs`),
    outputs: readPorts(outputs, `${where}.outputs`),
    data: data ?? null,
  };
}

/**
 * Reads a document written by `serializeFlow`, or throws a `FlowFormatError`. Node types and port
 * types are never checked: a node no plugin knows is read as it is, and written back as it was.
 * `plugins` may bring migrations of old node types (`FlowCorePlugin.migrate`); none by default.
 */
export function parseFlow<D = unknown>(json: string, plugins?: Plugins): FlowGraph<D> {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new FlowFormatError("Not JSON.");
  }
  if (!isObject(raw)) throw new FlowFormatError("A flow is an object.");
  if (raw.version !== FLOW_FORMAT_VERSION)
    throw new FlowFormatError(`Unknown version ${String(raw.version)}: this reads version 1.`);
  if (!Array.isArray(raw.nodes)) throw new FlowFormatError("nodes is not a list.");
  const registry = plugins ? registryOf(plugins) : undefined;
  const nodes = raw.nodes.map((n, i) => {
    const node = readNode(n, i);
    return registry ? registry.migrate(node) : node;
  });
  const ids = new Set<string>();
  const byId = new Map<string, FlowNode>();
  const claim = (id: string) => {
    if (ids.has(id)) throw new FlowFormatError(`The id "${id}" is used twice.`);
    ids.add(id);
  };
  for (const n of nodes) {
    claim(n.id);
    byId.set(n.id, n);
  }
  const edges: FlowEdge[] = (Array.isArray(raw.edges) ? raw.edges : []).map((e, i) => {
    const where = `edges[${i}]`;
    if (!isObject(e) || !isId(e.id)) throw new FlowFormatError(`${where}.id is missing.`);
    const end = (r: unknown, side: "in" | "out") => {
      if (!isObject(r) || !isId(r.node) || !isId(r.port))
        throw new FlowFormatError(`${where} needs a node and a port at each end.`);
      const node = byId.get(r.node);
      if (!node) throw new FlowFormatError(`${where}: no node "${r.node}".`);
      if (!portOf(node, side, r.port))
        throw new FlowFormatError(
          `${where}: "${r.node}" has no ${side === "in" ? "input" : "output"} "${r.port}".`,
        );
      return { node: r.node, port: r.port };
    };
    claim(e.id);
    return { id: e.id, from: end(e.from, "out"), to: end(e.to, "in") };
  });
  const grouped = new Set<string>();
  const groups: FlowGroup[] = (Array.isArray(raw.groups) ? raw.groups : []).map((g, i) => {
    const where = `groups[${i}]`;
    if (!isObject(g) || !isId(g.id)) throw new FlowFormatError(`${where}.id is missing.`);
    if (!Array.isArray(g.nodes) || !g.nodes.every((n) => typeof n === "string" && byId.has(n)))
      throw new FlowFormatError(`${where}.nodes must list nodes of the flow.`);
    for (const n of g.nodes as string[]) {
      if (grouped.has(n)) throw new FlowFormatError(`${where}: "${n}" is in two groups.`);
      grouped.add(n);
    }
    claim(g.id);
    return { id: g.id, label: typeof g.label === "string" ? g.label : "", nodes: [...g.nodes] };
  });
  return { version: FLOW_FORMAT_VERSION, nodes: nodes as FlowNode<D>[], edges, groups };
}
