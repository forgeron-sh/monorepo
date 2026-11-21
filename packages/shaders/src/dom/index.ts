// @forgeron/shaders/dom: the browser side. WebGL2 helpers and the GPU pipeline, the canvas glue
// (observers, loop, reduced motion, tokens) and the mounts of today's effects.

export { type DitherFieldOptions, mountDitherField } from "./dither-field";
export { FIELD_SHADERS, type FieldOptions, mountField } from "./field";
export { compileShader, linkProgram, PIXEL_CONTEXT, ShaderCompileError } from "./gl";
export { type HearthOptions, mountHearth } from "./hearth";
export { type DitheredImageOptions, mountDitheredImage } from "./image";
export {
  type GlExtensions,
  type GlFrameInputs,
  type GlPipeline,
  glPipeline,
  type GlPipelineOptions,
  type GlTargets,
  type GlTextures,
} from "./pipeline-gl";
export { createGlPipeline, floatTargets, textureStore } from "./pipeline-gl-ext";
export {
  mountPreset,
  type PresetHandle,
  type PresetInputs,
  type PresetMountOptions,
  runsOnGpu,
} from "./preset";
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
