// @forgeron/draw/plugins: the core halves of the bundled plugins and the preset lists. No React, no
// canvas React layer, no ui: a read-only place imports this and the core, nothing more. The editor
// halves are in `@forgeron/draw/plugins/editor`. Each family is also a subpath of its own
// (`.../plugins/shapes`, `.../plugins/lines`) for the plugins an app picks one by one.

import type { DrawPlugin } from "../core/plugin";
import { alignPlugin } from "./align";
import { frame } from "./frame";
import { groups } from "./groups";
import { lock } from "./lock";
import { image } from "./media";
import { arrow } from "./arrow";
import { json, png, svg } from "./export";
import { pen } from "./pen";
import { eraser } from "./lines";
import { diamond, ellipse, rectangle } from "./shapes";
import { sticky, text } from "./notes";
import { arrange, inspector, minimap, toolbar } from "./ui";

export { rectangle, ellipse, diamond, shapePlugins } from "./shapes";
export { sticky, text } from "./notes";
export { arrow, pen, eraser } from "./lines";
export { frame, groups, lock, alignPlugin } from "./layout";
export { image } from "./media";
export { svg, png, json } from "./export";
export { toolbar, inspector, minimap, arrange } from "./ui";

/** A rectangle and a text, the select and the hand of the canvas: the smallest board. */
export const minimalCorePlugins: ReadonlyArray<DrawPlugin> = [rectangle, text, toolbar];

/** Shapes, notes, the pen and the eraser: a sketch pad, with no arrows binding and no frames. */
export const sketchCorePlugins: ReadonlyArray<DrawPlugin> = [
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
export const fullCorePlugins: ReadonlyArray<DrawPlugin> = [
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

/** What a `variant` means: a named list of plugins. */
export const corePresets = {
  full: fullCorePlugins,
  sketch: sketchCorePlugins,
  minimal: minimalCorePlugins,
} as const;
