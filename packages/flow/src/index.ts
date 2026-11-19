// @forgeron/flow: the node-graph editor on @forgeron/canvas (D-148). This entry is the headless
// core: the graph document (nodes with typed ports, edges, groups), its edits and connection
// rules, the layered auto-layout, run state, JSON, and the binding to a canvas store. No React and
// no DOM; the view is `@forgeron/flow/react`.

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
  groupNodes,
  inputFor,
  insertOnEdge,
  outputFor,
  pasteSubgraph,
  reaches,
  reconnect,
  removeEdges,
  removeNodes,
  topologicalOrder,
  ungroup,
  updateNode,
} from "./core/graph";
export type { ConnectError, ConnectOptions, ConnectResult } from "./core/graph";
export { ARROW, edgeGeometry, edgePath, groupBounds, portOffset, portPoint } from "./core/geometry";
export type { EdgeGeometry, EdgeStyle } from "./core/geometry";
export { applyLayout, layoutGraph } from "./core/layout";
export type { LayoutOptions, LayoutResult } from "./core/layout";
export { countStatuses, edgeStatus, IDLE_RUN, nodeStatus, planRun } from "./core/run";
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
