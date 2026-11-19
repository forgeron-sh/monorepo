// @forgeron/shaders: the pixel effects of the lab language as a pipeline of passes with presets
// (docs/shaders/design.md). The neutral core: no DOM, no Node; the browser glue is `./dom`.

export { BAYER_GLSL, bayer, type BayerSize, matrix } from "./core/bayer";
export { type ColorRef, cssColor, parseColor, resolveRef, type RGB } from "./core/color";
export {
  bindChain,
  type Bound,
  type Chain,
  chainCellSize,
  type CpuChain,
  type CpuContext,
  type CpuPass,
  type CpuSource,
  createFrame,
  type FloatTable,
  type Frame,
  type GlChain,
  type GlslChunk,
  glslFloat,
  type GlslPass,
  type GlslSource,
  type Inputs,
  type PassDef,
  type PassHead,
  type PassKind,
  type PassMeta,
  type Preset,
  PRESET_SCHEMA_ID,
  type SourceDef,
  type SourceHead,
  type SourceMeta,
  type Step,
  toPreset,
  type UniformSetter,
} from "./core/contract";
export {
  type CpuInputs,
  perPixel,
  runCpu,
  type SvgPathOptions,
  toRgba,
  toSvgPath,
  toTones,
  valueAt,
} from "./core/cpu";
export { type CompileOptions, compileStages, GL_VERTEX, type GlStage } from "./core/glsl";
export { type ParamSpec, type ParamsSchema, type PresetIssue } from "./core/params";
export {
  BLUE_NOISE_SIZE,
  blueNoiseMask,
  blueNoiseMeta,
  type BlueNoiseParams,
} from "./core/passes/blue-noise";
export { blueNoiseCpu } from "./core/passes/blue-noise.cpu";
export { blueNoiseGlsl } from "./core/passes/blue-noise.glsl";
export { crtMeta, type CrtParams } from "./core/passes/crt";
export { crtCpu } from "./core/passes/crt.cpu";
export { crtGlsl } from "./core/passes/crt.glsl";
export { edgesMeta, type EdgesParams } from "./core/passes/edges";
export { edgesCpu } from "./core/passes/edges.cpu";
export { edgesGlsl } from "./core/passes/edges.glsl";
export {
  floydSteinbergGlsl,
  floydSteinbergMeta,
  type FloydSteinbergParams,
} from "./core/passes/floyd-steinberg";
export { floydSteinbergCpu } from "./core/passes/floyd-steinberg.cpu";
export { binomial, glowMeta, type GlowParams } from "./core/passes/glow";
export { glowCpu } from "./core/passes/glow.cpu";
export { glowGlsl } from "./core/passes/glow.glsl";
export { gridMeta, type GridParams } from "./core/passes/grid";
export { gridCpu } from "./core/passes/grid.cpu";
export { gridGlsl } from "./core/passes/grid.glsl";
export { halftoneMeta, type HalftoneParams } from "./core/passes/halftone";
export { halftoneCpu } from "./core/passes/halftone.cpu";
export { halftoneGlsl } from "./core/passes/halftone.glsl";
export {
  ditherImage,
  IMAGE_PALETTE,
  imageDitherMeta,
  type ImageDitherParams,
  type ImagePalette,
  imageTone,
} from "./core/passes/image-dither";
export { imageDitherCpu } from "./core/passes/image-dither.cpu";
export { imageDitherGlsl } from "./core/passes/image-dither.glsl";
export { orderedMeta, type OrderedParams } from "./core/passes/ordered";
export { orderedCpu } from "./core/passes/ordered.cpu";
export { orderedGlsl } from "./core/passes/ordered.glsl";
export { FIELD_TONES, paletteMeta, type PaletteParams } from "./core/passes/palette";
export { paletteCpu } from "./core/passes/palette.cpu";
export { paletteGlsl } from "./core/passes/palette.glsl";
export { pixelateMeta, type PixelateParams, pixelateStep } from "./core/passes/pixelate";
export { scanlinesMeta, type ScanlinesParams } from "./core/passes/scanlines";
export { scanlinesCpu } from "./core/passes/scanlines.cpu";
export { scanlinesGlsl } from "./core/passes/scanlines.glsl";
export {
  chainOf,
  checkPreset,
  definePass,
  defineSource,
  PASSES,
  PresetError,
  presetSchema,
  readPreset,
  SOURCES,
} from "./core/preset";
export {
  DITHER_FIELD_TONES,
  ditherFieldFrame,
  ditherFieldPreset,
  ditheredImagePreset,
  ditherPath,
  FIELD_BG,
  FIELD_HIGH,
  FIELD_LOW,
  fieldPreset,
  type FieldPresetOptions,
  hearthPreset,
} from "./core/presets";
export { builtInPresets, passPresets } from "./core/built-in";
export { bayerMaskPath, bayerMaskPreset } from "./core/masks";
export { constantMeta, type ConstantParams } from "./core/sources/constant";
export { constantCpu } from "./core/sources/constant.cpu";
export { constantGlsl } from "./core/sources/constant.glsl";
export {
  FIELD_FRAGMENT,
  FIELD_MODES,
  FIELD_VERTEX,
  type FieldMode,
  fieldMeta,
  type FieldParams,
} from "./core/sources/field";
export { fieldCpu, fieldValue } from "./core/sources/field.cpu";
export { fieldGlsl } from "./core/sources/field.glsl";
export {
  type CellRect,
  HEARTH_TONES,
  hearthCell,
  hearthFrame,
  hearthGrid,
  type HearthGrid,
  hearthMeta,
  type PixelFace,
} from "./core/sources/hearth";
export { hearthCpu } from "./core/sources/hearth.cpu";
export { heatMeta } from "./core/sources/heat";
export { heatCpu, heatLevel } from "./core/sources/heat.cpu";
export { imageMeta, type ImagePixels } from "./core/sources/image";
export { imageCpu } from "./core/sources/image.cpu";
export { imageGlsl } from "./core/sources/image.glsl";
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
export { type ToneFunction, toneMeta } from "./core/sources/tone";
export { toneCpu } from "./core/sources/tone.cpu";
