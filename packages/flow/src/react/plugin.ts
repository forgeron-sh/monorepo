// The plugin contract, editor half. Where the core half (`../core/plugin.ts`) says what a plugin
// means for the graph, this one says how it shows and behaves in the editor: how a kind of node is
// drawn, the layers around the nodes, what an edge is made of, the tools, the key bindings, the
// toolbar buttons and the panels over the surface. Slots are named places the host reads: the
// content plugins contribute, the interface plugins (`toolbar`) draw them.
//
// This file imports no React at run time (the types only), so tests and tools can build a registry
// without a renderer.

import type { Bounds, FarGroup, FarPrimitive } from "@forgeron/canvas";
import type { IconDefinition } from "@forgeron/icons";
import type { ComponentType, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { Point } from "@forgeron/canvas";
import {
  createRegistry,
  PluginError,
  resolvePlugins,
  type FlowCorePlugin,
  type Registry,
} from "../core/plugin";
import type { FlowEdge, FlowGraph, FlowGroup, FlowNode } from "../core/model";
import type { RunState, RunStatus } from "../core/run";
import type { FlowApi } from "./use-flow";

/* ================================================================== What the host knows */

export interface FlowNodeState {
  selected: boolean;
  status: RunStatus;
}

/** What the app gave `<FlowCanvas>` that a node renderer may need. */
export interface FlowHost<D> {
  /** The body of a node: a `StepCard layout="node"` for an automation. */
  renderNode?: ((node: FlowNode<D>, state: FlowNodeState) => ReactNode) | undefined;
  /** Names a node for assistive technology; `<type> <id>` by default. */
  nodeLabel?: ((node: FlowNode<D>) => string) | undefined;
}

/** What the editor shows now: a new object each time any of it changes. */
export interface FlowView<D> {
  /** The run to show; always `undefined` when no plugin of the editor shows runs. */
  run: RunState | undefined;
  /** The id of the edge style in force. */
  edgeStyle: string;
  /** The zoom is under the far level. */
  far: boolean;
  /** At most this many edges in the DOM (back from far, they come back a few at a time). */
  edgeLimit: number | null;
  /**
   * The flow is on the GPU at every zoom (a plugin brings the far view): edges and group frames
   * are drawn there, and the DOM holds only what takes the pointer (an edge's parts while it is
   * under the pointer, selected or dragged).
   */
  gpu: boolean;
  /** The edge and the group label under the pointer (GPU view). */
  hover: { edge: string | null; group: string | null };
  /** The edge whose end is being dragged, and how to say so (the GPU draws it as skipped). */
  dragging: string | null;
  setDragging: (edge: string | null) => void;
  /** The `controls` and `minimap` props. */
  controls: boolean;
  minimap: boolean;
  onInsert?: ((edge: FlowEdge, point: Point) => void) | undefined;
  onEdgeStyleChange?: ((style: string) => void) | undefined;
  edgeLabel?: ((edge: FlowEdge, from: FlowNode<D>, to: FlowNode<D>) => string) | undefined;
  host: FlowHost<D>;
}

/** A connection being dragged that a rule refuses: its reason, its sentence, where it started. */
export interface Refusal {
  reason: string;
  message: string;
  /** The id of the node the drag started on. */
  from: string;
}

interface RefusalStore {
  get(): Refusal | null;
  set(refusal: Refusal | null): void;
  subscribe(listener: () => void): () => void;
}

/** What a plugin of the editor gets: the flow, the registries, and the view as it is now. */
export interface FlowEditorContext<D> {
  flow: FlowApi<D>;
  registry: EditorRegistry<D>;
  /** The core registry of the same plugin list. */
  core: Registry;
  /** The view as of the last render: read it in an event handler, not while rendering. */
  view(): FlowView<D>;
  /** Why the connection being dragged is refused, while it is: the wire layer shows it. */
  refusal: RefusalStore;
  /** A value that lives as long as the editor, made by `init` the first time a plugin asks. */
  local<T>(pluginId: string, init: () => T): T;
}

/* ================================================================== Slots */

/** The body of a node of one kind, inside the box the host draws with its ports. */
export type NodeRenderer<D> = (
  node: FlowNode<D>,
  state: FlowNodeState,
  host: FlowHost<D>,
) => ReactNode;

/** `false`: not mine, go on. `"native"`: done, but let the browser's own event follow (copy). */
export type ToolResult = void | false | "native";

/** A command of the editor: a button, a key or another plugin may run it by id. */
export interface FlowTool<D> {
  label: string;
  icon?: IconDefinition;
  /** The key to show on its button, as typed: `⇧L`. */
  kbd?: string;
  run(ctx: FlowEditorContext<D>, event?: Event): ToolResult;
}

/** A key binding: `keys` as `matchShortcut` reads them (`mod+d`, `shift+l`, `delete`). */
export interface FlowShortcut {
  keys: string | ReadonlyArray<string>;
  tool: string;
}

export type ToolbarItem<D> =
  | {
      kind: "button";
      id: string;
      /** The tool it runs: its label, icon and first key come from there. */
      tool: string;
      /** Left to right, lower first. Default 100. */
      order?: number;
      when?(ctx: FlowEditorContext<D>): boolean;
    }
  | {
      kind: "choice";
      id: string;
      label: string;
      order?: number;
      when?(ctx: FlowEditorContext<D>, view: FlowView<D>): boolean;
      value(ctx: FlowEditorContext<D>, view: FlowView<D>): string;
      options(ctx: FlowEditorContext<D>): ReadonlyArray<{ value: string; label: string }>;
      set(ctx: FlowEditorContext<D>, value: string, view: FlowView<D>): void;
    };

export interface LayerProps<D> {
  ctx: FlowEditorContext<D>;
  view: FlowView<D>;
}

/** A component the host mounts in world space under or over the nodes, or over the surface. */
export interface Layer<D> {
  id: string;
  /** Bottom first, lower first. Default 100. */
  order?: number;
  component: ComponentType<LayerProps<D>>;
}

export interface InspectorProps<D> {
  ctx: FlowEditorContext<D>;
  /** The selected nodes and the ids of the selected edges; mounted only while one is selected. */
  nodes: ReadonlyArray<FlowNode<D>>;
  edges: ReadonlyArray<string>;
}

export interface Inspector<D> {
  id: string;
  order?: number;
  component: ComponentType<InspectorProps<D>>;
}

export interface EdgePartProps<D> {
  ctx: FlowEditorContext<D>;
  edge: FlowEdge;
  /** The path, the arrowhead polygon, the middle, and the end at the input. */
  d: string;
  arrow: string;
  mid: Point;
  end: Point;
  status: RunStatus;
  selected: boolean;
  hover: boolean;
  readOnly: boolean;
  onInsert: ((edge: FlowEdge, point: Point) => void) | undefined;
  /**
   * Starts dragging from this edge: the layer draws the preview wire and calls `onDrop` with the
   * event that ends the drag (`document.elementFromPoint` tells what is under it).
   */
  drag(e: ReactPointerEvent<Element>, onDrop: (ev: PointerEvent) => void): void;
}

/** A piece drawn inside each edge, after its line: the arrowhead, the insert button, a handle. */
export interface EdgePart<D> {
  id: string;
  order?: number;
  render(p: EdgePartProps<D>): ReactNode;
}

/** An edge on the GPU: its shapes (one canvas group) and where it can be clicked. */
export interface FarEdge {
  edge: FlowEdge;
  /** Its path flattened, world units, as made: drawn moved by `dx`, `dy` when they are given. */
  points: number[];
  /** Where it is drawn: its box and middle with the move included. */
  box: Bounds;
  mid: Point;
  group: FarGroup;
  /** How far it is drawn from `points` (a drag moved both its nodes); 0 when left out. */
  dx?: number;
  dy?: number;
}

/** A group's frame and its label's box, world units. */
export interface FarGroupFrame {
  group: FlowGroup;
  frame: Bounds;
  label: Bounds;
}

/**
 * The flow on the canvas's GPU layer, at every zoom: each node's box (under its rich card near, a
 * labelled box with its ports from far), each edge, each group's frame. The host hit-tests the
 * same shapes for clicks on an edge or a group's label. Without it, everything is DOM.
 */
export interface FarSlot<D> {
  node(
    node: FlowNode<D>,
    info: {
      status: RunStatus;
      selected: boolean;
      label: string;
      /** Under this zoom the node is its labelled box (its card is not mounted). */
      farZoom: number;
      /** The colour token of a port type, if a plugin gives it one. */
      portColor: (type: string | undefined) => string | undefined;
    },
  ): FarPrimitive[];
  edges?(
    ctx: FlowEditorContext<D>,
    graph: FlowGraph<D>,
    info: {
      run: RunState | undefined;
      edgeStyle: string;
      /** The edge under the pointer and the one whose end is being dragged. */
      hover: string | null;
      dragging: string | null;
      /** An `arrowhead` edge part is there. */
      arrows: boolean;
    },
    selected: ReadonlySet<string>,
  ): FarEdge[];
  groups?(
    ctx: FlowEditorContext<D>,
    graph: FlowGraph<D>,
    info: { hover: string | null },
  ): { frames: FarGroupFrame[]; drawn: FarGroup[] };
}

/** Native events on the editor's root. Each runs after the tools' keys; the first to say so wins. */
export interface FlowHandlers<D> {
  copy?(ctx: FlowEditorContext<D>, e: ClipboardEvent): void;
  paste?(ctx: FlowEditorContext<D>, e: ClipboardEvent): void;
  /** Before anything under it sees a pointer press on the root. */
  pointerDownCapture?(ctx: FlowEditorContext<D>, e: PointerEvent): void;
}

export interface ToolbarViewProps<D> {
  ctx: FlowEditorContext<D>;
  view: FlowView<D>;
  className?: string | undefined;
}

/* ================================================================== The plugin */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FlowEditorPlugin<D = any> {
  /** Its core half: the plugin's id, name and what it means for the graph. */
  readonly core: FlowCorePlugin;
  /** How the kinds of node it names are drawn; `"*"` draws every kind nobody else does. */
  readonly nodeRenderers?: Readonly<Record<string, NodeRenderer<D>>>;
  /** Commands by id. */
  readonly tools?: Readonly<Record<string, FlowTool<D>>>;
  readonly shortcuts?: ReadonlyArray<FlowShortcut>;
  readonly toolbar?: ReadonlyArray<ToolbarItem<D>>;
  readonly layers?: {
    /** In world space, under the nodes: group frames, edges. */
    below?: ReadonlyArray<Layer<D>>;
    /** In world space, over the nodes: the wire of a connection being made. */
    above?: ReadonlyArray<Layer<D>>;
    /** Over the surface, in the canvas's chrome: zoom controls, the minimap. */
    overlay?: ReadonlyArray<Layer<D>>;
  };
  /** Panels over the surface about the selection (properties of a node). */
  readonly inspector?: ReadonlyArray<Inspector<D>>;
  /** What each edge is made of besides its line. */
  readonly edgeParts?: ReadonlyArray<EdgePart<D>>;
  /** The far level; the editor has none without a plugin that brings it. */
  readonly far?: FarSlot<D>;
  readonly handlers?: FlowHandlers<D>;
  /** The parts of the interface that draw what the others contribute. */
  readonly ui?: { toolbar?: ComponentType<ToolbarViewProps<D>> };
}

/** Typed identity: `defineEditorPlugin({ core, ... })` checks the shape and returns it. */
export function defineEditorPlugin<const P extends FlowEditorPlugin>(plugin: P): P {
  return plugin;
}

/** A list entry: an editor plugin, or a core half alone (it brings no drawing). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FlowPluginEntry<D = any> = FlowEditorPlugin<D> | FlowCorePlugin;

const isEditor = <D>(p: FlowPluginEntry<D>): p is FlowEditorPlugin<D> => "core" in p;

/* ================================================================== The registry */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EditorRegistry<D = any> {
  /** The plugins in dependency order. */
  readonly plugins: ReadonlyArray<FlowEditorPlugin<D>>;
  /** The core halves, same order, and their registry. */
  readonly core: Registry;
  has(pluginId: string): boolean;
  /** The renderer of a kind of node: its own, else the `"*"` one, else none. */
  nodeRenderer(type: string): NodeRenderer<D> | undefined;
  tool(id: string): FlowTool<D> | undefined;
  readonly shortcuts: ReadonlyArray<FlowShortcut>;
  readonly toolbar: ReadonlyArray<ToolbarItem<D>>;
  readonly below: ReadonlyArray<Layer<D>>;
  readonly above: ReadonlyArray<Layer<D>>;
  readonly overlay: ReadonlyArray<Layer<D>>;
  readonly inspector: ReadonlyArray<Inspector<D>>;
  readonly edgeParts: ReadonlyArray<EdgePart<D>>;
  readonly far: FarSlot<D> | undefined;
  readonly handlers: ReadonlyArray<FlowHandlers<D>>;
  readonly ui: { toolbar?: ComponentType<ToolbarViewProps<D>> };
  /** A plugin shows runs: the `run` prop is passed on, otherwise it is ignored. */
  readonly showsRun: boolean;
}

const byOrder = <T extends { order?: number }>(list: T[]): T[] =>
  list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => (a.item.order ?? 100) - (b.item.order ?? 100) || a.i - b.i)
    .map((x) => x.item);

/**
 * Composes a plugin list into what the host reads. Checks it as the core does (a duplicate id, a
 * missing dependency, a cycle, two owners of a kind) and adds: two plugins drawing the same kind of
 * node, or giving a tool the same id, are refused too. Throws `PluginError`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEditorRegistry<D = any>(
  list: ReadonlyArray<FlowPluginEntry<D>>,
): EditorRegistry<D> {
  const entries = list.map((p) => (isEditor(p) ? p : { core: p }) as FlowEditorPlugin<D>);
  const order = resolvePlugins(entries.map((p) => p.core));
  const byCore = new Map(entries.map((p) => [p.core.id, p] as const));
  const plugins = order.map((c) => byCore.get(c.id)!);
  const core = createRegistry(order);

  const renderers = new Map<string, { fn: NodeRenderer<D>; plugin: string }>();
  const tools = new Map<string, { tool: FlowTool<D>; plugin: string }>();
  const shortcuts: FlowShortcut[] = [];
  const toolbar: ToolbarItem<D>[] = [];
  const below: Layer<D>[] = [];
  const above: Layer<D>[] = [];
  const overlay: Layer<D>[] = [];
  const inspector: Inspector<D>[] = [];
  const edgeParts: EdgePart<D>[] = [];
  const handlers: FlowHandlers<D>[] = [];
  const ui: { toolbar?: ComponentType<ToolbarViewProps<D>> } = {};
  let far: { slot: FarSlot<D>; plugin: string } | undefined;
  const ids = new Set<string>();
  const unique = (what: string, id: string, plugin: string) => {
    const key = `${what}:${id}`;
    if (ids.has(key)) throw new PluginError(`${what} "${id}" of plugin "${plugin}" is taken`);
    ids.add(key);
  };

  for (const plugin of plugins) {
    const id = plugin.core.id;
    for (const [type, fn] of Object.entries(plugin.nodeRenderers ?? {})) {
      const taken = renderers.get(type);
      if (taken) {
        throw new PluginError(
          `Node kind "${type}" is drawn by "${taken.plugin}" and by "${id}": only one plugin draws a kind`,
        );
      }
      renderers.set(type, { fn, plugin: id });
    }
    for (const [name, tool] of Object.entries(plugin.tools ?? {})) {
      const taken = tools.get(name);
      if (taken) {
        throw new PluginError(
          `Tool "${name}" of plugin "${id}" is already brought by "${taken.plugin}"`,
        );
      }
      tools.set(name, { tool, plugin: id });
    }
    shortcuts.push(...(plugin.shortcuts ?? []));
    for (const item of plugin.toolbar ?? []) {
      unique("Toolbar item", item.id, id);
      toolbar.push(item);
    }
    for (const l of plugin.layers?.below ?? []) {
      unique("Layer", l.id, id);
      below.push(l);
    }
    for (const l of plugin.layers?.above ?? []) {
      unique("Layer", l.id, id);
      above.push(l);
    }
    for (const l of plugin.layers?.overlay ?? []) {
      unique("Layer", l.id, id);
      overlay.push(l);
    }
    for (const i of plugin.inspector ?? []) {
      unique("Inspector", i.id, id);
      inspector.push(i);
    }
    for (const part of plugin.edgeParts ?? []) {
      unique("Edge part", part.id, id);
      edgeParts.push(part);
    }
    if (plugin.far) {
      if (far)
        throw new PluginError(
          `Plugin "${id}" brings a far view, which "${far.plugin}" already does`,
        );
      far = { slot: plugin.far, plugin: id };
    }
    if (plugin.handlers) handlers.push(plugin.handlers);
    if (plugin.ui?.toolbar) ui.toolbar = plugin.ui.toolbar;
  }
  for (const s of shortcuts) {
    if (!tools.has(s.tool))
      throw new PluginError(`A shortcut names the tool "${s.tool}", which no plugin brings`);
  }
  for (const item of toolbar) {
    if (item.kind === "button" && !tools.has(item.tool)) {
      throw new PluginError(
        `Toolbar item "${item.id}" names the tool "${item.tool}", which no plugin brings`,
      );
    }
  }
  const wildcard = renderers.get("*")?.fn;
  const sets = new Set(plugins.map((p) => p.core.id));
  return {
    plugins,
    core,
    has: (id) => sets.has(id),
    nodeRenderer: (type) => renderers.get(type)?.fn ?? wildcard,
    tool: (id) => tools.get(id)?.tool,
    shortcuts,
    toolbar: byOrder(toolbar),
    below: byOrder(below),
    above: byOrder(above),
    overlay: byOrder(overlay),
    inspector: byOrder(inspector),
    edgeParts: byOrder(edgeParts),
    far: far?.slot,
    handlers,
    ui,
    showsRun: sets.has("run"),
  };
}

const keys = new WeakMap<object, number>();
let nextKey = 1;
/** A number that identifies a plugin list by identity: the host remounts its body when it changes. */
export function listKey(list: object): number {
  let k = keys.get(list);
  if (k === undefined) {
    k = nextKey++;
    keys.set(list, k);
  }
  return k;
}
