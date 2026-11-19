// @forgeron/shaders/dom: the browser side. WebGL2 helpers and the GPU pipeline, the canvas glue
// (observers, loop, reduced motion, tokens) and the mounts of today's effects.

export { type DitherFieldOptions, mountDitherField } from "./dither-field";
export { FIELD_SHADERS, type FieldOptions, mountField } from "./field";
export { compileShader, linkProgram, PIXEL_CONTEXT, ShaderCompileError } from "./gl";
export { type HearthOptions, mountHearth } from "./hearth";
export { type DitheredImageOptions, mountDitheredImage } from "./image";
export {
  createGlPipeline,
  type GlFrameInputs,
  type GlPipeline,
  type GlPipelineOptions,
} from "./pipeline-gl";
export { mountReveal, type RevealHandle, type RevealOptions } from "./reveal";
export {
  animateCanvas,
  type AnimateCanvasOptions,
  colorCache,
  prefersStill,
  readTone,
  resolveColor,
  type ShaderHandle,
  tokenReader,
} from "./surface";
