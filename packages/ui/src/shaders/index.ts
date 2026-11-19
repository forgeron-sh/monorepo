// Shaders: the pixel fields and effects of the lab language. The pictures and their canvas glue
// are @forgeron/shaders (D-149, docs/shaders/design.md); here are the thin React wrappers, the
// CSS, and ui's names over the package (re-exported as they were).

export {
  bandOf,
  bayer,
  type BayerSize,
  type CellRect,
  DITHER_FIELD_TONES,
  ditherFieldFrame,
  ditherPath,
  FIELD_BG,
  FIELD_HIGH,
  FIELD_LOW,
  type FieldMode,
  haloCells,
  HEARTH_TONES,
  hearthCell,
  hearthFrame,
  type HearthGrid,
  type Painted,
  REVEAL_BANDS,
  REVEAL_END,
  REVEAL_MARGIN,
  type RevealCell,
  revealCells,
  revealFrame,
} from "@forgeron/shaders";
export {
  animateCanvas,
  type DitheredImageOptions,
  type DitherFieldOptions,
  FIELD_SHADERS,
  mountDitheredImage,
  mountDitherField,
  mountReveal,
  prefersStill,
  readTone,
  type RevealHandle,
  type RevealOptions,
  type ShaderHandle,
} from "@forgeron/shaders/dom";
export {
  type FieldShaderOptions,
  hearthGrid,
  type HearthOptions,
  mountFieldShader,
  mountHearth,
} from "./mounts";
export { textRows } from "./text-rows";
export {
  DitheredImage,
  type DitheredImageProps,
  DitherField,
  type DitherFieldProps,
  FieldShader,
  type FieldShaderProps,
  Hearth,
  type HearthProps,
  PixelReveal,
  type PixelRevealProps,
} from "./react";
