// Shaders: the pixel fields and effects of the lab language, framework-free mounts and thin React
// wrappers. The pictures come from @forgeron/blueprint's core (Bayer matrix, field shader, image
// dither, pixel face); the canvas glue is here.

export { bayer, type BayerSize } from "@forgeron/blueprint";
export { animateCanvas, prefersStill, readTone, type ShaderHandle } from "./surface";
export {
  DITHER_FIELD_TONES,
  ditherFieldFrame,
  type DitherFieldOptions,
  FIELD_BG,
  FIELD_HIGH,
  FIELD_LOW,
  mountDitherField,
} from "./dither-field";
export { ditherPath } from "./dither-svg";
export { FIELD_SHADERS, type FieldMode, type FieldShaderOptions, mountFieldShader } from "./field";
export { type DitheredImageOptions, mountDitheredImage } from "./image";
export {
  type CellRect,
  HEARTH_TONES,
  hearthCell,
  hearthFrame,
  hearthGrid,
  type HearthGrid,
  type HearthOptions,
  mountHearth,
} from "./hearth";
export {
  bandOf,
  haloCells,
  mountReveal,
  type Painted,
  REVEAL_BANDS,
  REVEAL_END,
  REVEAL_MARGIN,
  type RevealCell,
  revealCells,
  revealFrame,
  type RevealHandle,
  type RevealOptions,
  textRows,
} from "./reveal";
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
