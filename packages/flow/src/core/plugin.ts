// The plugin contract, core half. A feature of the flow editor is a plugin of two halves in two
// entry points: this one, framework-free (it imports no React, no canvas React layer and no ui, so
// a read-only place, a Worker that validates a graph or a server that computes a layout loads it
// without loading an editor), and an editor half (`../react/plugin.ts`) with the drawing, the
// interaction, the toolbar buttons and the key bindings.
//
// The core half says what a plugin means for the graph: the kinds of node and their ports, the
// types of port, the rules that refuse a connection (and why), the edge styles, the layout engine,
// the run planner, how groups and the clipboard work, and how old JSON is migrated. The registry
// composes a list of core halves; the functions of the core take that list.

import type { Bounds, Point, Size } from "@forgeron/canvas";
import type { EdgeGeometry } from "./geometry";
import type { FlowEdge, FlowGraph, FlowNode, FlowPort, GraphIndex, PortRef } from "./model";
import type { NodeOutcome, RunState } from "./run";

/* ================================================================== What a plugin brings */

/** What a kind of node is: how it is offered, how big it is and which ports it starts with. */
export interface NodeKindSpec<D = unknown> {
  /** Shown in menus and in the unknown-kind box: `Trigger`, `Condition`. */
  label: string;
  description?: string;
  /** A name of `@forgeron/icons`; the editor draws it. */
  icon?: string;
  /** The box of a new node. 240 × 80 by default. */
  size?: Size;
  inputs?: ReadonlyArray<FlowPort>;
  outputs?: ReadonlyArray<FlowPort>;
  /** The `data` of a new node. */
  data?: () => D;
}

/** What a type of port is: what it is called and, optionally, which other types it takes. */
export interface PortTypeSpec {
  label: string;
  description?: string;
  /** A colour token (`--accent`): the editor tints ports and wires of this type. */
  color?: string;
  /** Types an input of this type also takes, besides itself and `any`. */
  accepts?: ReadonlyArray<string>;
}

export interface ConnectOptions {
  /** `forbid` (default): an edge that closes a loop is refused. `allow`: loops are drawn. */
  cycles?: "forbid" | "allow";
  /** Whether an output of type `from` may feed an input of type `to`. Equal types, or `any`. */
  compatible?: (from: string, to: string) => boolean;
  /** The plugins whose rules apply; the `full` preset's when none. */
  plugins?: Plugins;
}

/** What a connection rule sees: the two ports and what the graph already holds around them. */
export interface ConnectionContext<D = unknown> {
  graph: FlowGraph<D>;
  index: GraphIndex<D>;
  from: PortRef;
  to: PortRef;
  source: FlowNode<D>;
  target: FlowNode<D>;
  /** The output port the edge would leave from, and the input it would enter. */
  out: FlowPort;
  input: FlowPort;
  /** The edges already leaving `out` and already entering `input`. */
  leaving: ReadonlyArray<FlowEdge>;
  entering: ReadonlyArray<FlowEdge>;
  options: ConnectOptions;
  registry: Registry;
}

/** A rule that may refuse an edge, and says why. Every rule a plugin brings is asked in turn. */
export interface ConnectionRule {
  /** Unique across the plugins: `type`, `occupied`. */
  id: string;
  /** `null` to accept, else the reason: a short code (`type`) or a sentence. */
  check(ctx: ConnectionContext): string | null;
  /**
   * Whether two ports may ever be wired together, whatever the graph holds: used to pick the
   * ports of a node dropped on an edge. Without it the rule has no say there.
   */
  matches?(out: FlowPort, input: FlowPort, options: ConnectOptions, registry: Registry): boolean;
  /** The sentence for each reason code the rule gives. */
  messages?: Readonly<Record<string, string>>;
}

/** How an edge is drawn between two port points. Pure geometry. */
export interface EdgeStyleSpec {
  label: string;
  /** `around`: the bounds of the two nodes, for a path that goes round them. */
  path(a: Point, b: Point, around?: readonly [Bounds, Bounds]): EdgeGeometry;
}

/** Where a layout engine puts the nodes. */
export interface LayoutResult {
  /** The top-left corner of each node. */
  positions: Map<string, Point>;
  /** The nodes of each layer, top to bottom (an engine without layers says one per node). */
  layers: string[][];
  /** Crossings left between the layers. */
  crossings: number;
  /** The edges turned around to break cycles. */
  reversed: string[];
}

/** Common to every engine: the grid to snap to and where the top-left of the drawing goes. */
export interface LayoutBase {
  grid?: number;
  origin?: Point;
}

/** An auto-layout: where each node goes, as a pure function of the graph. */
export interface LayoutEngine<O extends LayoutBase = LayoutBase> {
  label: string;
  layout<D>(graph: FlowGraph<D>, options?: O): LayoutResult;
}

/** Turns a graph and what each node does into the frames of a run. */
export interface RunPlanner {
  label: string;
  plan<D>(graph: FlowGraph<D>, decide?: (node: FlowNode<D>) => NodeOutcome): RunState[];
}

/** Frames derived from nodes: a group is a list of node ids, its frame is computed. */
export interface GroupSpec {
  group<D>(graph: FlowGraph<D>, ids: Iterable<string>, label: string, id?: string): FlowGraph<D>;
  ungroup<D>(graph: FlowGraph<D>, groupId: string): FlowGraph<D>;
  /** The frame of a group: its nodes' bounds plus a margin, with room for the label on top. */
  bounds<D>(
    index: GraphIndex<D>,
    nodes: ReadonlyArray<string>,
    padding?: number,
    label?: number,
  ): Bounds | null;
}

/** How a copy leaves the graph and comes back: text (flow JSON) in, nodes out. */
export interface ClipboardSpec {
  /** The selected nodes, the edges between them and the groups wholly inside, as text. */
  copy<D>(graph: FlowGraph<D>, ids: Iterable<string>): string;
  /** The fragment text holds, or `null` when it is not one of ours. */
  read<D>(text: string): FlowGraph<D> | null;
  /** The fragment added under new ids, moved by `offset`; the new ids, old to new. */
  paste<D>(
    graph: FlowGraph<D>,
    fragment: FlowGraph<D>,
    offset: Point,
  ): { graph: FlowGraph<D>; ids: Map<string, string> };
}

/* ================================================================== The plugin */

export interface FlowCorePlugin {
  /** Unique, stable, short: `layered`, `cycles`. */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Ids of plugins that must be in the list too (and come first). */
  readonly requires?: readonly string[];
  /** The node types it owns, by `FlowNode.type`. */
  readonly nodeKinds?: Readonly<Record<string, NodeKindSpec>>;
  /** The port types it declares, by `FlowPort.type`. */
  readonly portTypes?: Readonly<Record<string, PortTypeSpec>>;
  /** Rules asked, in plugin order, when an edge is made, moved or dropped. */
  readonly connectionRules?: ReadonlyArray<ConnectionRule>;
  /** The edge styles it draws, by id (`bezier`). */
  readonly edgeStyles?: Readonly<Record<string, EdgeStyleSpec>>;
  /** The layout engines it provides, by id. */
  readonly layouts?: Readonly<Record<string, LayoutEngine<never>>>;
  /** The run planners it provides, by id. */
  readonly runPlanners?: Readonly<Record<string, RunPlanner>>;
  /** How groups work; one plugin at most. */
  readonly groups?: GroupSpec;
  /** How copies leave and enter the graph; one plugin at most. */
  readonly clipboard?: ClipboardSpec;
  /** Old node types it still reads, turned into the current ones when JSON is read. */
  readonly migrate?: Readonly<Record<string, (node: FlowNode) => FlowNode>>;
}

/** Typed identity: `definePlugin({ id: ... })` checks the shape and returns it. */
export function definePlugin<const P extends FlowCorePlugin>(plugin: P): P {
  return plugin;
}

/** A broken plugin list: a duplicate id, a missing dependency, a cycle, two owners of one thing. */
export class PluginError extends Error {
  override name = "PluginError";
}

/** A list of core halves, or the registry already built from it. */
export type Plugins = ReadonlyArray<FlowCorePlugin> | Registry;

/* ================================================================== The registry */

export interface Registry {
  /** The plugins in dependency order. */
  readonly plugins: ReadonlyArray<FlowCorePlugin>;
  has(pluginId: string): boolean;
  /** What a node type is, when a plugin owns it. */
  kind(type: string): NodeKindSpec | undefined;
  readonly kinds: ReadonlyArray<{ type: string; spec: NodeKindSpec; plugin: string }>;
  portType(name: string): PortTypeSpec | undefined;
  readonly portTypes: ReadonlyArray<{ name: string; spec: PortTypeSpec; plugin: string }>;
  /** The connection rules, in plugin order. */
  readonly rules: ReadonlyArray<ConnectionRule>;
  edgeStyle(id: string): EdgeStyleSpec | undefined;
  readonly edgeStyles: ReadonlyArray<{ id: string; spec: EdgeStyleSpec }>;
  /** The engine of that id, or the first registered when none is named. */
  layout(id?: string): LayoutEngine<never> | undefined;
  readonly layouts: ReadonlyArray<{ id: string; spec: LayoutEngine<never> }>;
  planner(id?: string): RunPlanner | undefined;
  readonly planners: ReadonlyArray<{ id: string; spec: RunPlanner }>;
  readonly groups: GroupSpec | undefined;
  readonly clipboard: ClipboardSpec | undefined;
  /** Turns a legacy node into its current form. */
  migrate<D>(node: FlowNode<D>): FlowNode<D>;
  /** Whether every rule that has an opinion lets these two ports be wired. */
  matches(out: FlowPort, input: FlowPort, options?: ConnectOptions): boolean;
  /** The sentence for a refusal: the rule's own text, else the reason itself. */
  explain(reason: string): string;
  /** A new node of a registered kind (without an id): its size, ports and data from the kind. */
  createNode<D = unknown>(
    type: string,
    init?: Partial<Omit<FlowNode<D>, "id" | "type">> & { id?: string },
  ): Omit<FlowNode<D>, "id"> & { id?: string };
}

/** Orders a plugin list by dependency and checks it. Throws `PluginError`. */
export function resolvePlugins(list: ReadonlyArray<FlowCorePlugin>): FlowCorePlugin[] {
  const byId = new Map<string, FlowCorePlugin>();
  for (const plugin of list) {
    if (byId.has(plugin.id)) throw new PluginError(`Duplicate plugin id "${plugin.id}"`);
    byId.set(plugin.id, plugin);
  }
  const out: FlowCorePlugin[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (plugin: FlowCorePlugin, trail: string[]) => {
    const seen = state.get(plugin.id);
    if (seen === "done") return;
    if (seen === "visiting") {
      throw new PluginError(`Plugin dependency cycle: ${[...trail, plugin.id].join(" -> ")}`);
    }
    state.set(plugin.id, "visiting");
    for (const need of plugin.requires ?? []) {
      const dep = byId.get(need);
      if (!dep) throw new PluginError(`Plugin "${plugin.id}" requires "${need}", which is missing`);
      visit(dep, [...trail, plugin.id]);
    }
    state.set(plugin.id, "done");
    out.push(plugin);
  };
  for (const plugin of list) visit(plugin, []);
  return out;
}

const DEFAULT_SIZE: Size = { w: 240, h: 80 };

/** Composes a plugin list into the lookups every function of the core uses. Throws `PluginError`. */
export function createRegistry(list: ReadonlyArray<FlowCorePlugin>): Registry {
  const plugins = resolvePlugins(list);
  const ids = new Set(plugins.map((p) => p.id));
  const kinds = new Map<string, { spec: NodeKindSpec; plugin: string }>();
  const portTypes = new Map<string, { spec: PortTypeSpec; plugin: string }>();
  const rules: ConnectionRule[] = [];
  const ruleIds = new Map<string, string>();
  const edgeStyles = new Map<string, { spec: EdgeStyleSpec; plugin: string }>();
  const layouts = new Map<string, { spec: LayoutEngine<never>; plugin: string }>();
  const planners = new Map<string, { spec: RunPlanner; plugin: string }>();
  const migrations = new Map<string, (node: FlowNode) => FlowNode>();
  let groups: { spec: GroupSpec; plugin: string } | undefined;
  let clipboard: { spec: ClipboardSpec; plugin: string } | undefined;

  const claim = <T>(
    map: Map<string, { spec: T; plugin: string }>,
    what: string,
    key: string,
    spec: T,
    plugin: string,
  ) => {
    const taken = map.get(key);
    if (taken) {
      throw new PluginError(
        `${what} "${key}" of plugin "${plugin}" is already owned by "${taken.plugin}"`,
      );
    }
    map.set(key, { spec, plugin });
  };

  for (const plugin of plugins) {
    for (const [type, spec] of Object.entries(plugin.nodeKinds ?? {})) {
      claim(kinds, "Node kind", type, spec, plugin.id);
    }
    for (const [name, spec] of Object.entries(plugin.portTypes ?? {})) {
      claim(portTypes, "Port type", name, spec, plugin.id);
    }
    for (const rule of plugin.connectionRules ?? []) {
      const taken = ruleIds.get(rule.id);
      if (taken) {
        throw new PluginError(
          `Connection rule "${rule.id}" of plugin "${plugin.id}" is already owned by "${taken}"`,
        );
      }
      ruleIds.set(rule.id, plugin.id);
      rules.push(rule);
    }
    for (const [id, spec] of Object.entries(plugin.edgeStyles ?? {})) {
      claim(edgeStyles, "Edge style", id, spec, plugin.id);
    }
    for (const [id, spec] of Object.entries(plugin.layouts ?? {})) {
      claim(layouts, "Layout engine", id, spec, plugin.id);
    }
    for (const [id, spec] of Object.entries(plugin.runPlanners ?? {})) {
      claim(planners, "Run planner", id, spec, plugin.id);
    }
    if (plugin.groups) {
      if (groups) {
        throw new PluginError(
          `Plugin "${plugin.id}" brings groups, which plugin "${groups.plugin}" already does`,
        );
      }
      groups = { spec: plugin.groups, plugin: plugin.id };
    }
    if (plugin.clipboard) {
      if (clipboard) {
        throw new PluginError(
          `Plugin "${plugin.id}" brings a clipboard, which plugin "${clipboard.plugin}" already does`,
        );
      }
      clipboard = { spec: plugin.clipboard, plugin: plugin.id };
    }
    for (const [type, fn] of Object.entries(plugin.migrate ?? {})) migrations.set(type, fn);
  }
  const withMatches = rules.filter((r) => r.matches);
  const messages = new Map<string, string>();
  for (const rule of rules) {
    for (const [reason, text] of Object.entries(rule.messages ?? {})) messages.set(reason, text);
  }

  const first = <T>(map: Map<string, { spec: T }>, id?: string) =>
    id === undefined ? map.values().next().value?.spec : map.get(id)?.spec;
  const entries = <K extends string, T>(
    map: Map<string, { spec: T; plugin: string }>,
    key: K,
  ): ReadonlyArray<{ [P in K]: string } & { spec: T; plugin: string }> =>
    [...map].map(
      ([k, v]) => ({ [key]: k, ...v }) as { [P in K]: string } & { spec: T; plugin: string },
    );

  const registry: Registry = {
    plugins,
    has: (id) => ids.has(id),
    kind: (type) => kinds.get(type)?.spec,
    kinds: entries(kinds, "type"),
    portType: (name) => portTypes.get(name)?.spec,
    portTypes: entries(portTypes, "name"),
    rules,
    edgeStyle: (id) => edgeStyles.get(id)?.spec,
    edgeStyles: [...edgeStyles].map(([id, v]) => ({ id, spec: v.spec })),
    layout: (id) => first(layouts, id),
    layouts: [...layouts].map(([id, v]) => ({ id, spec: v.spec })),
    planner: (id) => first(planners, id),
    planners: [...planners].map(([id, v]) => ({ id, spec: v.spec })),
    groups: groups?.spec,
    clipboard: clipboard?.spec,
    migrate: (node) => {
      const fn = migrations.get(node.type);
      return fn ? (fn(node as FlowNode) as typeof node) : node;
    },
    matches: (out, input, options = {}) =>
      withMatches.every((r) => r.matches!(out, input, options, registry)),
    explain: (reason) => messages.get(reason) ?? reason,
    createNode: (type, init = {}) => {
      const spec = kinds.get(type)?.spec;
      if (!spec) throw new PluginError(`No plugin brings the node kind "${type}"`);
      return {
        ...init,
        type,
        position: init.position ?? { x: 0, y: 0 },
        size: init.size ?? spec.size ?? DEFAULT_SIZE,
        inputs: init.inputs ?? spec.inputs?.map((p) => ({ ...p })) ?? [],
        outputs: init.outputs ?? spec.outputs?.map((p) => ({ ...p })) ?? [],
        data: (init.data ?? spec.data?.() ?? null) as never,
      };
    },
  };
  return registry;
}

const cache = new WeakMap<ReadonlyArray<unknown>, Registry>();

/** The registry of a plugin list (cached by the array), or a registry as is. */
export function registryOf(plugins: Plugins): Registry {
  if (!Array.isArray(plugins)) return plugins as Registry;
  const list = plugins as ReadonlyArray<FlowCorePlugin>;
  let registry = cache.get(list);
  if (!registry) {
    registry = createRegistry(list);
    cache.set(list, registry);
  }
  return registry;
}
