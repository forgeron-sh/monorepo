// @forgeron/blueprint: the core. Pure TypeScript: no DOM, no React, no Node module.
// Blocks → scene (iso 2:1, fit) → frame of materials → filters → SVG or RGBA.

export { bayer, type BayerSize } from "./core/bayer";
export { BlueprintError, box, dot, floorGrid, label, line } from "./core/blocks";
export {
  type ColorRef,
  DEFAULT_PALETTE,
  dither,
  type DitherFilter,
  type Filter,
  glow,
  type GlowFilter,
  grid,
  type GridFilter,
  palette,
  type PaletteFilter,
  pixelate,
  type PixelateFilter,
  type Plan,
  plan,
} from "./core/filters";
export { type Frame, Material, Slot, type SlotName } from "./core/frame";
export {
  cssColor,
  paint,
  parseColor,
  type ResolvedPalette,
  type RGB,
  resolvePalette,
} from "./core/palette";
export { fit, type Point, project } from "./core/project";
export {
  frameView,
  rasterSize,
  render,
  type Rendered,
  type RenderOptions,
  sceneAt,
} from "./core/render";
export { FIELD_FRAGMENT, FIELD_MODES, FIELD_VERTEX, type FieldMode } from "./core/field";
export {
  embolden,
  FORGE_SANS,
  type Glyph,
  GLYPHS,
  glyph,
  glyphWidth,
  textSvg,
  type TextSvgOptions,
  textWidth,
} from "./core/font";
export { ditherImage, IMAGE_PALETTE, type ImagePalette } from "./core/image";
export { renderSvg, toSvg } from "./core/svg";
export type {
  Block,
  BoxBlock,
  DotBlock,
  FitOptions,
  Ink,
  LabelBlock,
  LineBlock,
  Scene,
  SceneFn,
  SceneFrame,
  SceneSource,
  Vec3,
  View,
} from "./core/types";
export * as examples from "./examples/scenes";
