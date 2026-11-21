// @forgeron/flow/plugins/editor: the editor halves of the bundled plugins and the preset lists
// (`minimal`, `typed`, `full`). They draw, take pointer and key input and contribute toolbar
// buttons, so they import React and the canvas React layer; the core halves, which do not, are in
// `@forgeron/flow/plugins`. Each family is also a subpath of its own (`.../plugins/editor/edges`).

export { clipboard } from "./clipboard";
export {
  connectionPlugins,
  fanOut,
  noCycles,
  noDuplicates,
  portTypes,
  selfLoop,
  singleInput,
} from "./connect";
export { edgeArrowsPlugin, edgeInsertPlugin, edgeReconnectPlugin } from "./edge-parts";
export { bezier, orthogonal } from "./edge-styles";
export { edges, FlowConnectionWire, FlowEdges } from "./edges";
export { FlowGroups, groups } from "./groups";
export { layout } from "./layout";
export { nodes } from "./nodes";
export { run } from "./run";
export { deleteKeys, far, minimap, toolbar, zoomControls } from "./ui";
export {
  fullEditorPlugins,
  minimalEditorPlugins,
  presetPlugins,
  typedEditorPlugins,
} from "./presets";
export type { FlowPreset } from "./presets";
