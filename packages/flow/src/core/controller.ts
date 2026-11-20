// The flow editor without a view: a canvas store and the edits of a graph. Each edit computes the
// next graph with the pure functions of `graph.ts`, then writes the difference to the store as one
// gesture, so it is one undo step whatever it touched (a deleted node and the edges into it, a
// pasted subgraph, a whole layout). The React layer and tests drive the same object.

import type { CanvasStore, ConnectionEnd, Point } from "@forgeron/canvas";
import type { LayoutOptions } from "../plugins/layout";
import { registryOrDefault } from "./defaults";
import { applyLayout, removeEdges, removeNodes, updateNode } from "./edit";
import {
  checkConnection,
  connect,
  inputFor,
  insertOnEdge,
  outputFor,
  reconnect,
  type ConnectResult,
} from "./graph";
import { graphToItems, isNodeItem, itemsToGraphAfter, NODE_KIND, type FlowItemData } from "./items";
import { idsOf, nextId, type FlowGraph, type FlowNode, type PortRef, type PortSide } from "./model";
import type { ConnectOptions, LayoutResult, Plugins, Registry } from "./plugin";
import { parseFlow, serializeFlow } from "./serialize";

export type FlowStore<D = unknown> = CanvasStore<FlowItemData<D>>;

/** The `data-canvas-handle` of a port: `in:<port>` or `out:<port>`. */
export const portHandle = (side: PortSide, port: string) => `${side}:${port}`;

export function parseHandle(handle: string | undefined): { side: PortSide; port: string } | null {
  const m = handle ? /^(in|out):(.+)$/.exec(handle) : null;
  return m ? { side: m[1] as PortSide, port: m[2]! } : null;
}

export interface FlowControllerOptions {
  connect?: Omit<ConnectOptions, "plugins">;
  /** The options of the layout engine (the layered one's by default). */
  layout?: LayoutOptions;
  /** The core halves of the plugins in force; the `full` preset's when none. */
  plugins?: Plugins;
}

export type NewNode<D> = Omit<FlowNode<D>, "id"> & { id?: string };

export interface FlowController<D = unknown> {
  readonly store: FlowStore<D>;
  /** The registry of the plugins in force. */
  registry(): Registry;
  /** Changes the plugins in force (the rules, the layout, the clipboard...); the document stays. */
  setPlugins(plugins: Plugins): void;
  /** The graph the canvas holds now (cached until the items change). */
  graph(): FlowGraph<D>;
  /** Writes `next` to the canvas as one undo step; false when nothing changed. */
  commit(next: FlowGraph<D>, label?: string): boolean;
  /** Replaces the document; clears the history and the selection. */
  load(source: FlowGraph<D> | string): void;
  toJSON(space?: number): string;
  /** The output and input a connect gesture between two canvas ends means, or null. */
  resolve(from: ConnectionEnd, to: ConnectionEnd): { from: PortRef; to: PortRef } | null;
  canConnectEnds(from: ConnectionEnd, to: ConnectionEnd): boolean;
  /**
   * Why a connect gesture between two canvas ends is refused (the reason code and its sentence),
   * or null when it may be made (or means nothing, like a port onto the same node).
   */
  refusal(from: ConnectionEnd, to: ConnectionEnd): { reason: string; message: string } | null;
  connect(from: PortRef, to: PortRef): ConnectResult<D>;
  connectEnds(from: ConnectionEnd, to: ConnectionEnd): ConnectResult<D> | null;
  reconnect(edgeId: string, end: "from" | "to", ref: PortRef): ConnectResult<D>;
  removeEdges(ids: Iterable<string>): void;
  /** Adds a node (its id from its type when it has none), selects it, optionally fed by `from`. */
  addNode(node: NewNode<D>, from?: PortRef): FlowNode<D>;
  /** Adds a node of a kind a plugin brings (its size, ports and data from the kind). */
  addKind(
    type: string,
    init?: Partial<Omit<FlowNode<D>, "id" | "type">> & { id?: string },
    from?: PortRef,
  ): FlowNode<D>;
  insertOnEdge(edgeId: string, node: NewNode<D>): ConnectResult<D>;
  updateNode(id: string, patch: Partial<Omit<FlowNode<D>, "id">>, label?: string): void;
  /** Deletes the selected nodes (and their edges) and these edges, as one step. */
  deleteSelection(edgeIds?: Iterable<string>): void;
  duplicateSelection(): string[];
  /** The selected nodes and the edges between them as flow JSON, kept for `paste`. */
  copySelection(): string | null;
  /** Pastes flow JSON (the last copy by default) at a world point or one grid cell further. */
  paste(json?: string, at?: Point): string[];
  groupSelection(label: string): void;
  ungroup(groupId: string): void;
  autoLayout(options?: LayoutOptions): LayoutResult;
}

export function createFlowController<D>(
  store: FlowStore<D>,
  options: FlowControllerOptions = {},
): FlowController<D> {
  let cachedItems: unknown = null;
  let cached: FlowGraph<D> | null = null;
  let clipboard: string | null = null;
  let pasteCount = 0;
  let registry = registryOrDefault(options.plugins);
  // The rules are read at each call: the plugins may change under a running editor.
  let ruleOptions: ConnectOptions = { ...options.connect, plugins: registry };
  const rules = () => ruleOptions;

  const graph = () => {
    const items = store.getState().items;
    if (items !== cachedItems || !cached) {
      cached = itemsToGraphAfter<D>(
        items,
        cached && cachedItems ? { items: cachedItems as typeof items, graph: cached } : null,
      );
      cachedItems = items;
    }
    return cached;
  };

  const commit = (next: FlowGraph<D>, label = "Edit") => {
    const state = store.getState();
    const current = new Map(state.items.map((i) => [i.id, i] as const));
    let top = state.items.reduce((z, i) => Math.max(z, i.z), -1);
    const want = graphToItems(next);
    const wanted = new Set(want.map((i) => i.id));
    const removes = state.items.filter((i) => isNodeItem(i) && !wanted.has(i.id)).map((i) => i.id);
    const updates: Array<
      readonly [string, { bounds?: (typeof want)[number]["bounds"]; data?: FlowItemData<D> }]
    > = [];
    const adds: typeof want = [];
    for (const item of want) {
      const old = current.get(item.id);
      if (!old) {
        adds.push({ ...item, z: ++top });
        continue;
      }
      const b = old.bounds;
      const change: { bounds?: typeof item.bounds; data?: FlowItemData<D> } = {};
      if (
        b.x !== item.bounds.x ||
        b.y !== item.bounds.y ||
        b.w !== item.bounds.w ||
        b.h !== item.bounds.h
      )
        change.bounds = item.bounds;
      if (JSON.stringify(old.data) !== JSON.stringify(item.data)) change.data = item.data;
      if (change.bounds || change.data) updates.push([item.id, change]);
    }
    if (!removes.length && !updates.length && !adds.length) return false;
    store.beginGesture(label);
    if (removes.length) store.remove(removes);
    if (updates.length) store.updateMany(updates);
    if (adds.length) store.add(adds);
    store.endGesture();
    return true;
  };

  const selectedNodes = () =>
    store
      .getState()
      .items.filter(
        (i) => i.kind === NODE_KIND && !i.locked && store.getState().selection.has(i.id),
      )
      .map((i) => i.id);

  const resolve = (from: ConnectionEnd, to: ConnectionEnd) => {
    const a = parseHandle(from.handle);
    if (!a || from.itemId === to.itemId) return null;
    const b = parseHandle(to.handle);
    const g = graph();
    if (a.side === "out") {
      const source = { node: from.itemId, port: a.port };
      const target = b
        ? b.side === "in"
          ? { node: to.itemId, port: b.port }
          : null
        : inputFor(g, source, to.itemId, rules());
      return target ? { from: source, to: target } : null;
    }
    // Dragged backwards, from an input to an output.
    const target = { node: from.itemId, port: a.port };
    const source = b
      ? b.side === "out"
        ? { node: to.itemId, port: b.port }
        : null
      : outputFor(g, to.itemId, target, rules());
    return source ? { from: source, to: target } : null;
  };

  const doConnect = (from: PortRef, to: PortRef) => {
    const r = connect(graph(), from, to, rules());
    if (r.ok) commit(r.graph, "Connect");
    return r;
  };

  const paste = (json = clipboard ?? undefined, at?: Point): string[] => {
    const board = registry.clipboard;
    if (!json || !board) return [];
    const fragment = board.read<D>(json);
    if (!fragment || fragment.nodes.length === 0) return [];
    const minX = Math.min(...fragment.nodes.map((n) => n.position.x));
    const minY = Math.min(...fragment.nodes.map((n) => n.position.y));
    pasteCount++;
    const step = store.grid.size;
    const offset = at
      ? { x: at.x - minX, y: at.y - minY }
      : { x: step * pasteCount, y: step * pasteCount };
    const { graph: next, ids } = board.paste(graph(), fragment, offset);
    commit(next, "Paste");
    const created = fragment.nodes.map((n) => ids.get(n.id)!);
    store.select(created);
    return created;
  };

  const copySelection = () => {
    const ids = selectedNodes();
    if (ids.length === 0 || !registry.clipboard) return null;
    clipboard = registry.clipboard.copy(graph(), ids);
    pasteCount = 0;
    return clipboard;
  };

  const addNode = (node: NewNode<D>, from?: PortRef): FlowNode<D> => {
    const g = graph();
    const full: FlowNode<D> = { ...node, id: node.id ?? nextId(node.type || "node", idsOf(g)) };
    let next: FlowGraph<D> = { ...g, nodes: [...g.nodes, full] };
    if (from) {
      const to = inputFor(next, from, full.id, rules());
      const r = to ? connect(next, from, to, rules()) : null;
      if (r?.ok) next = r.graph;
    }
    commit(next, "Add");
    store.select([full.id]);
    return full;
  };

  return {
    store,
    registry: () => registry,
    setPlugins: (next) => {
      registry = registryOrDefault(next);
      ruleOptions = { ...options.connect, plugins: registry };
    },
    graph,
    commit,
    load: (source) => {
      const g = typeof source === "string" ? parseFlow<D>(source, registry) : source;
      store.replace(graphToItems(g));
    },
    toJSON: (space) => serializeFlow(graph(), space),
    resolve,
    canConnectEnds: (from, to) => {
      const r = resolve(from, to);
      return !!r && checkConnection(graph(), r.from, r.to, rules()) === null;
    },
    refusal: (from, to) => {
      const g = graph();
      let r = resolve(from, to);
      const a = parseHandle(from.handle);
      if (!r && a?.side === "out" && !parseHandle(to.handle) && from.itemId !== to.itemId) {
        // Dropped on a node no input of which takes it: the reason is the first input's.
        const first = g.nodes.find((n) => n.id === to.itemId)?.inputs[0];
        if (first)
          r = {
            from: { node: from.itemId, port: a.port },
            to: { node: to.itemId, port: first.id },
          };
      }
      if (!r) return null;
      const reason = checkConnection(g, r.from, r.to, rules());
      return reason ? { reason, message: registry.explain(reason) } : null;
    },
    connect: doConnect,
    connectEnds: (from, to) => {
      const r = resolve(from, to);
      return r ? doConnect(r.from, r.to) : null;
    },
    reconnect: (edgeId, end, ref) => {
      const r = reconnect(graph(), edgeId, end, ref, rules());
      if (r.ok) commit(r.graph, "Reconnect");
      return r;
    },
    removeEdges: (ids) => void commit(removeEdges(graph(), ids), "Delete"),
    addNode,
    addKind: (type, init, from) => addNode(registry.createNode<D>(type, init), from),
    insertOnEdge: (edgeId, node) => {
      const g = graph();
      const full: FlowNode<D> = { ...node, id: node.id ?? nextId(node.type || "node", idsOf(g)) };
      const r = insertOnEdge(g, edgeId, full, rules());
      if (r.ok) {
        commit(r.graph, "Insert");
        store.select([full.id]);
      }
      return r;
    },
    updateNode: (id, patch, label = "Edit") => void commit(updateNode(graph(), id, patch), label),
    deleteSelection: (edgeIds = []) => {
      const nodes = selectedNodes();
      commit(removeEdges(removeNodes(graph(), nodes), edgeIds), "Delete");
    },
    duplicateSelection: () => {
      const board = registry.clipboard;
      if (!board) return [];
      const json = board.copy(graph(), selectedNodes());
      const keep = clipboard;
      const keepCount = pasteCount;
      pasteCount = 0;
      const created = paste(json);
      clipboard = keep;
      pasteCount = keepCount;
      return created;
    },
    copySelection,
    paste,
    groupSelection: (label) => {
      if (registry.groups) commit(registry.groups.group(graph(), selectedNodes(), label), "Group");
    },
    ungroup: (groupId) => {
      if (registry.groups) commit(registry.groups.ungroup(graph(), groupId), "Ungroup");
    },
    autoLayout: (overrides) => {
      const engine = registry.layout();
      const g = graph();
      // No layout plugin: nothing moves.
      if (!engine) return { positions: new Map(), layers: [], crossings: 0, reversed: [] };
      const step = store.grid.size;
      const origin = g.nodes.length
        ? {
            x: Math.round(Math.min(...g.nodes.map((n) => n.position.x)) / step) * step,
            y: Math.round(Math.min(...g.nodes.map((n) => n.position.y)) / step) * step,
          }
        : { x: 0, y: 0 };
      const result = engine.layout(g, {
        grid: step,
        origin,
        ...options.layout,
        ...overrides,
      } as never);
      commit(applyLayout(g, result), "Auto-layout");
      return result;
    },
  };
}
