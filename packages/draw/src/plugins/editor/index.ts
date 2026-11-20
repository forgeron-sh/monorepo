// @forgeron/draw/plugins/editor: the editor halves of the bundled plugins (tools, how items look in
// the DOM, panels, keys, exports) and the preset lists. Import the core halves from
// `@forgeron/draw/plugins`; the editor takes these. Each family is also a subpath of its own.

export { alignPlugin, arrange, groups, lock } from "./arrange";
export { arrow, bindTargetAt, eraser, pen } from "./lines";
export { json, png, svg } from "./export";
export { frame } from "./frame";
export { addImage, image, inlineImages } from "./media";
export { sticky, text } from "./notes";
export { diamond, ellipse, rectangle, shapePanel } from "./shapes";
export { inspector, minimap, toolbar } from "./ui";
export { boxTool } from "./kit";
export {
  editorPresets,
  fullEditorPlugins,
  minimalEditorPlugins,
  sketchEditorPlugins,
} from "./presets";
export { createEditorRegistry, defineEditorPlugin } from "../../react/plugin";
export type {
  ConnectSpec,
  DropSpec,
  EditorContext,
  EditorPlugin,
  EditorRegistry,
  ItemViewOptions,
  KeyInput,
  KeySpec,
  KindView,
  MenuItem,
  MenuState,
  OverlaySpec,
  PanelProps,
  PanelSpec,
  Slots,
  ToolbarButtonSpec,
  ToolSpec,
  UiComponent,
  UiProps,
} from "../../react/plugin";
