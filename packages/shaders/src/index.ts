// @forgeron/shaders: the pixel effects of the lab language as a pipeline of passes with presets
// (docs/shaders/design.md). The neutral core: no DOM, no Node; the browser glue is `./dom`.

export { BAYER_GLSL, bayer, type BayerSize, matrix } from "./core/bayer";
export { type ColorRef, cssColor, parseColor, resolveRef, type RGB } from "./core/color";
export {
  bindPass,
  bindSource,
  type Bound,
  type Chain,
  chainCellSize,
  type CpuContext,
  createFrame,
  type Frame,
  type GlslChunk,
  glslFloat,
  type Inputs,
  type PassDef,
  type PassKind,
  type Preset,
  PRESET_SCHEMA_ID,
  type SourceDef,
  type Step,
  toPreset,
  type UniformSetter,
} from "./core/contract";
export { type CpuInputs, runCpu, toRgba, toSvgPath, toTones } from "./core/cpu";
export { type CompileOptions, compileStages, GL_VERTEX, type GlStage } from "./core/glsl";
export { type ParamSpec, type ParamsSchema, type PresetIssue } from "./core/params";
export { type GridParams, gridPass } from "./core/passes/grid";
export {
  ditherImage,
  IMAGE_PALETTE,
  imageDitherPass,
  type ImageDitherParams,
  type ImagePalette,
  imageTone,
} from "./core/passes/image-dither";
export { type OrderedParams, orderedPass } from "./core/passes/ordered";
export { FIELD_TONES, type PaletteParams, palettePass } from "./core/passes/palette";
export { type PixelateParams, pixelatePass } from "./core/passes/pixelate";
export {
  chainOf,
  checkPreset,
  PASSES,
  PresetError,
  presetSchema,
  readPreset,
  SOURCES,
} from "./core/preset";
export {
  DITHER_FIELD_TONES,
  ditherFieldChain,
  ditherFieldFrame,
  ditherFieldPreset,
  ditheredImageChain,
  ditheredImagePreset,
  ditherPath,
  FIELD_BG,
  FIELD_HIGH,
  FIELD_LOW,
  fieldChain,
  fieldPreset,
  type FieldPresetOptions,
  hearthChain,
  hearthPreset,
  builtInPresets,
} from "./core/presets";
export {
  FIELD_FRAGMENT,
  FIELD_MODES,
  FIELD_VERTEX,
  type FieldMode,
  fieldSource,
  fieldValue,
} from "./core/sources/field";
export {
  type CellRect,
  HEARTH_TONES,
  hearthCell,
  hearthFrame,
  hearthGrid,
  type HearthGrid,
  hearthSource,
  type PixelFace,
} from "./core/sources/hearth";
export { heatLevel, heatSource } from "./core/sources/heat";
export { imageSource, type ImagePixels } from "./core/sources/image";
export {
  bandOf,
  haloCells,
  type Painted,
  REVEAL_BANDS,
  REVEAL_END,
  REVEAL_MARGIN,
  type RevealCell,
  revealCells,
  revealExtent,
  revealFrame,
} from "./core/sources/reveal";
export { type ToneFunction, toneSource } from "./core/sources/tone";
