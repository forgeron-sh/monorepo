// @forgeron/flow/react: the flow editor on the canvas. Import the styles once, after those of ui
// and canvas: `import "@forgeron/flow/styles.css"`. What the editor does comes from its plugins
// (`plugins`, or a `preset`): the editor halves of the bundled ones are in
// `@forgeron/flow/plugins/editor`.

export { FlowCanvas } from "./flow-canvas";
export type { FlowCanvasProps } from "./flow-canvas";
export { FlowConnectionWire, FlowEdges } from "../plugins/editor/edges";
export { FlowGroups } from "../plugins/editor/groups";
export { FlowToolbar } from "./toolbar";
export type { FlowToolbarProps } from "./toolbar";
export { useFlow } from "./use-flow";
export type { FlowApi, UseFlowOptions } from "./use-flow";
export { createEditorRegistry, defineEditorPlugin } from "./plugin";
export type {
  EdgePart,
  EdgePartProps,
  EditorRegistry,
  FarSlot,
  FlowEditorContext,
  FlowEditorPlugin,
  FlowHandlers,
  FlowHost,
  FlowNodeState,
  FlowPluginEntry,
  FlowShortcut,
  FlowTool,
  FlowView,
  Inspector,
  InspectorProps,
  Layer,
  LayerProps,
  NodeRenderer,
  ToolbarItem,
  ToolbarViewProps,
  ToolResult,
} from "./plugin";
export type { FlowPreset } from "../plugins/editor/presets";
