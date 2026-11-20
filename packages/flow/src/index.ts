// @forgeron/flow: the node-graph editor on @forgeron/canvas (D-148, D-155). This entry is the
// headless core: the graph document (nodes with ports as data, edges, groups), its edits, JSON, the
// controller over a canvas store and the plugin host. Everything else (node kinds, port types,
// connection rules, edge styles, the layered auto-layout, groups, run state, the clipboard) is a
// plugin: the core halves are in `@forgeron/flow/plugins`, the drawing in
// `@forgeron/flow/react` and `@forgeron/flow/plugins/editor`. No React and no DOM here.

export {
  ANY,
  emptyGraph,
  FLOW_FORMAT_VERSION,
  idsOf,
  indexGraph,
  nextId,
  portOf,
} from "./core/model";
export type {
  FlowEdge,
  FlowGraph,
  FlowGroup,
  FlowNode,
  FlowPort,
  GraphIndex,
  PortRef,
  PortSide,
} from "./core/model";
export {
  addNodes,
  canConnect,
  checkConnection,
  connect,
  extractSubgraph,
  inputFor,
  insertOnEdge,
  outputFor,
  pasteSubgraph,
  reaches,
  reconnect,
  removeEdges,
  removeNodes,
  topologicalOrder,
  updateNode,
} from "./core/graph";
export type { ConnectError, ConnectResult } from "./core/graph";
export { applyLayout } from "./core/edit";
export {
  ARROW,
  edgeBounds,
  edgeGeometryWith,
  portOffset,
  portPoint,
  straightPath,
} from "./core/geometry";
export type { EdgeGeometry, EdgePath, EdgeStyle } from "./core/geometry";
export { countStatuses, edgeStatus, IDLE_RUN, nodeStatus } from "./core/run";
export type { NodeOutcome, RunState, RunStatus } from "./core/run";
export { FlowFormatError, parseFlow, serializeFlow } from "./core/serialize";
export {
  flowKinds,
  graphToItems,
  isNodeItem,
  itemsToGraph,
  NODE_KIND,
  nodeOfItem,
} from "./core/items";
export type { FlowItem, FlowItemData } from "./core/items";
export { createFlowController, parseHandle, portHandle } from "./core/controller";
export type { FlowController, FlowControllerOptions, FlowStore, NewNode } from "./core/controller";
export { generateFlowGraph } from "./core/generate";
export type { GenerateOptions } from "./core/generate";

// The plugin contract and host.
export {
  createRegistry,
  definePlugin,
  PluginError,
  registryOf,
  resolvePlugins,
} from "./core/plugin";
export type {
  ClipboardSpec,
  ConnectionContext,
  ConnectionRule,
  ConnectOptions,
  EdgeStyleSpec,
  FlowCorePlugin,
  GroupSpec,
  LayoutBase,
  LayoutEngine,
  LayoutResult,
  NodeKindSpec,
  Plugins,
  PortTypeSpec,
  Registry,
  RunPlanner,
} from "./core/plugin";
export { DEFAULT_REGISTRY, registryOrDefault } from "./core/defaults";

// What the bundled plugins give, as plain functions: the editor behaves as before without
// naming a plugin (the `full` preset), and these stay usable on their own.
export { bezierPath, edgeGeometry, edgePath, orthogonalPath } from "./plugins/edges";
export { layoutGraph } from "./plugins/layout";
export type { LayoutOptions } from "./plugins/layout";
export { planRun } from "./plugins/run";
export { groupBounds, groupNodes, ungroup } from "./plugins/groups";
export { fullCorePlugins, minimalCorePlugins, typedCorePlugins } from "./plugins/index";
