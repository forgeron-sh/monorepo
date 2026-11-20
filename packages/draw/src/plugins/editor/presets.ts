// What `variant` means for the editor: a named list of plugins, the editor halves of
// `@forgeron/draw/plugins`' presets.

import type { EditorPlugin } from "../../react/plugin";
import { alignPlugin, arrange, groups, lock } from "./arrange";
import { arrow } from "./arrow";
import { eraser } from "./eraser";
import { json, png, svg } from "./export";
import { frame } from "./frame";
import { image } from "./media";
import { sticky, text } from "./notes";
import { pen } from "./pen";
import { diamond, ellipse, rectangle } from "./shapes";
import { inspector, minimap, toolbar } from "./ui";

/** A rectangle and a text, with the tool dock: the smallest board. */
export const minimalEditorPlugins: ReadonlyArray<EditorPlugin> = [rectangle, text, toolbar];

/** Shapes, notes, the pen and the eraser: a sketch pad, with no arrows binding and no frames. */
export const sketchEditorPlugins: ReadonlyArray<EditorPlugin> = [
  rectangle,
  ellipse,
  diamond,
  sticky,
  text,
  pen,
  eraser,
  groups,
  lock,
  alignPlugin,
  arrange,
  svg,
  png,
  json,
  toolbar,
  inspector,
];

/** Every bundled plugin, in the order of the dock: what ships today. */
export const fullEditorPlugins: ReadonlyArray<EditorPlugin> = [
  rectangle,
  ellipse,
  diamond,
  sticky,
  text,
  arrow,
  pen,
  eraser,
  frame,
  image,
  groups,
  lock,
  alignPlugin,
  arrange,
  svg,
  png,
  json,
  toolbar,
  inspector,
  minimap,
];

export const editorPresets = {
  full: fullEditorPlugins,
  sketch: sketchEditorPlugins,
  minimal: minimalEditorPlugins,
} as const;
