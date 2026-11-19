import {
  type Chain,
  type CpuPass,
  type CpuSource,
  type GlslPass,
  type GlslSource,
  type PassDef,
  type PassMeta,
  PRESET_SCHEMA_ID,
  type Preset,
  type SourceDef,
  type SourceMeta,
  type Step,
} from "./contract";
import { jsonSchemaOf, type PresetIssue, readParams } from "./params";
import { blueNoiseMeta } from "./passes/blue-noise";
import { blueNoiseCpu } from "./passes/blue-noise.cpu";
import { blueNoiseGlsl } from "./passes/blue-noise.glsl";
import { crtMeta } from "./passes/crt";
import { crtCpu } from "./passes/crt.cpu";
import { crtGlsl } from "./passes/crt.glsl";
import { edgesMeta } from "./passes/edges";
import { edgesCpu } from "./passes/edges.cpu";
import { edgesGlsl } from "./passes/edges.glsl";
import { floydSteinbergMeta } from "./passes/floyd-steinberg";
import { floydSteinbergCpu } from "./passes/floyd-steinberg.cpu";
import { glowMeta } from "./passes/glow";
import { glowCpu } from "./passes/glow.cpu";
import { glowGlsl } from "./passes/glow.glsl";
import { gridMeta } from "./passes/grid";
import { gridCpu } from "./passes/grid.cpu";
import { gridGlsl } from "./passes/grid.glsl";
import { halftoneMeta } from "./passes/halftone";
import { halftoneCpu } from "./passes/halftone.cpu";
import { halftoneGlsl } from "./passes/halftone.glsl";
import { imageDitherMeta } from "./passes/image-dither";
import { imageDitherCpu } from "./passes/image-dither.cpu";
import { imageDitherGlsl } from "./passes/image-dither.glsl";
import { orderedMeta } from "./passes/ordered";
import { orderedCpu } from "./passes/ordered.cpu";
import { orderedGlsl } from "./passes/ordered.glsl";
import { paletteMeta } from "./passes/palette";
import { paletteCpu } from "./passes/palette.cpu";
import { paletteGlsl } from "./passes/palette.glsl";
import { pixelateMeta, pixelateStep } from "./passes/pixelate";
import { scanlinesMeta } from "./passes/scanlines";
import { scanlinesCpu } from "./passes/scanlines.cpu";
import { scanlinesGlsl } from "./passes/scanlines.glsl";
import { constantMeta } from "./sources/constant";
import { constantCpu } from "./sources/constant.cpu";
import { constantGlsl } from "./sources/constant.glsl";
import { fieldMeta } from "./sources/field";
import { fieldCpu } from "./sources/field.cpu";
import { fieldGlsl } from "./sources/field.glsl";
import { hearthMeta } from "./sources/hearth";
import { hearthCpu } from "./sources/hearth.cpu";
import { heatMeta } from "./sources/heat";
import { heatCpu } from "./sources/heat.cpu";
import { imageMeta } from "./sources/image";
import { imageCpu } from "./sources/image.cpu";
import { imageGlsl } from "./sources/image.glsl";
import { toneMeta } from "./sources/tone";
import { toneCpu } from "./sources/tone.cpu";

/**
 * Presets: an effect as data (docs/shaders/design.md §3). `version: 1`; the schema is
 * `schema/preset.v1.json`, written from the params of the passes and sources below. This module
 * holds every definition with its three parts: a live mount does not import it.
 */

/** The three parts of a pass as one definition; `glsl` null for a CPU-only pass. */
export function definePass<P>(
  meta: PassMeta,
  glsl: GlslPass<P> | null,
  cpu: CpuPass<P>,
): PassDef<never> {
  return { ...meta, glsl: (glsl?.glsl ?? null) as PassDef<never>["glsl"], cpu: cpu.cpu as never };
}

/** The parts of a source as one definition; `glsl` null for a CPU-only source. */
export function defineSource<P>(
  meta: SourceMeta,
  glsl: GlslSource<P> | null,
  cpu: CpuSource<P>,
): SourceDef<never> {
  return { ...meta, glsl: (glsl?.glsl ?? null) as SourceDef<never>["glsl"], cpu: cpu.cpu as never };
}

/** The passes a preset may use, by type. */
export const PASSES: Readonly<Record<string, PassDef<never>>> = {
  pixelate: definePass(pixelateMeta, pixelateStep, pixelateStep),
  ordered: definePass(orderedMeta, orderedGlsl, orderedCpu),
  "image-dither": definePass(imageDitherMeta, imageDitherGlsl, imageDitherCpu),
  palette: definePass(paletteMeta, paletteGlsl, paletteCpu),
  grid: definePass(gridMeta, gridGlsl, gridCpu),
  "blue-noise": definePass(blueNoiseMeta, blueNoiseGlsl, blueNoiseCpu),
  "floyd-steinberg": definePass(floydSteinbergMeta, null, floydSteinbergCpu),
  halftone: definePass(halftoneMeta, halftoneGlsl, halftoneCpu),
  scanlines: definePass(scanlinesMeta, scanlinesGlsl, scanlinesCpu),
  edges: definePass(edgesMeta, edgesGlsl, edgesCpu),
  glow: definePass(glowMeta, glowGlsl, glowCpu),
  crt: definePass(crtMeta, crtGlsl, crtCpu),
};

/** The sources a preset may start from, by type. */
export const SOURCES: Readonly<Record<string, SourceDef<never>>> = {
  field: defineSource(fieldMeta, fieldGlsl, fieldCpu),
  heat: defineSource(heatMeta, null, heatCpu),
  image: defineSource(imageMeta, imageGlsl, imageCpu),
  tone: defineSource(toneMeta, null, toneCpu),
  hearth: defineSource(hearthMeta, null, hearthCpu),
  constant: defineSource(constantMeta, constantGlsl, constantCpu),
};

export class PresetError extends Error {
  constructor(readonly issues: readonly PresetIssue[]) {
    super(`Invalid shader preset: ${issues.map((i) => `${i.path} ${i.message}`).join("; ")}.`);
    this.name = "PresetError";
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Checks a preset (parsed JSON or an object) and fills its defaults. Unknown keys, sources and
 * passes are issues; `pixelate` must come first, a cell-reading pass cannot follow a `present`
 * one. Returns the issues instead of the preset when there are any.
 */
export function checkPreset(input: unknown): { preset: Preset } | { issues: PresetIssue[] } {
  const issues: PresetIssue[] = [];
  if (!isObject(input)) return { issues: [{ path: "$", message: "must be an object" }] };
  for (const key of Object.keys(input))
    if (!["$schema", "version", "name", "source", "passes"].includes(key))
      issues.push({ path: `$.${key}`, message: "is not a key of a preset" });
  if (input.version !== 1) issues.push({ path: "$.version", message: "must be 1" });
  if (input.name !== undefined && typeof input.name !== "string")
    issues.push({ path: "$.name", message: "must be a string" });
  let source: Step = { type: "" };
  if (!isObject(input.source) || typeof input.source.type !== "string")
    issues.push({ path: "$.source", message: "must be an object with a type" });
  else {
    const def = SOURCES[input.source.type];
    if (!def)
      issues.push({ path: "$.source.type", message: `unknown source "${input.source.type}"` });
    else source = readParams(def.params, input.source, "$.source", issues) as Step;
  }
  const passes: Step[] = [];
  if (!Array.isArray(input.passes)) issues.push({ path: "$.passes", message: "must be a list" });
  else {
    let present = "";
    input.passes.forEach((raw: unknown, i) => {
      const path = `$.passes[${i}]`;
      if (!isObject(raw) || typeof raw.type !== "string") {
        issues.push({ path, message: "must be an object with a type" });
        return;
      }
      const def = PASSES[raw.type];
      if (!def) {
        issues.push({ path: `${path}.type`, message: `unknown pass "${raw.type}"` });
        return;
      }
      if (def.kind === "layout" && i !== 0)
        issues.push({ path, message: `"${raw.type}" must come first` });
      if (def.usesCell && present)
        issues.push({ path, message: `"${raw.type}" reads cells and cannot follow "${present}"` });
      if (def.kind === "present") present ||= raw.type;
      passes.push(readParams(def.params, raw, path, issues) as Step);
    });
  }
  if (issues.length > 0) return { issues };
  const preset: Preset = { version: 1, source, passes };
  if (typeof input.name === "string") preset.name = input.name;
  if (typeof input.$schema === "string") preset.$schema = input.$schema;
  return { preset };
}

/** `checkPreset` that throws a `PresetError`. */
export function readPreset(input: unknown): Preset {
  const r = checkPreset(input);
  if ("issues" in r) throw new PresetError(r.issues);
  return r.preset;
}

/** The chain of a preset (checked first: throws a `PresetError`), with every definition. */
export function chainOf(input: Preset | unknown): Chain<SourceDef<never>, PassDef<never>> {
  const preset = readPreset(input);
  const { type: sourceType, ...sourceParams } = preset.source;
  const chain: Chain<SourceDef<never>, PassDef<never>> = {
    source: { def: SOURCES[sourceType] as SourceDef<never>, params: sourceParams },
    passes: preset.passes.map(({ type, ...params }) => ({
      def: PASSES[type] as PassDef<never>,
      params,
    })),
  };
  if (preset.name) chain.name = preset.name;
  return chain;
}

function stepSchema(
  type: string,
  def: { description: string; params: PassMeta["params"] },
): Record<string, unknown> {
  const properties: Record<string, unknown> = { type: { const: type } };
  for (const [k, spec] of Object.entries(def.params)) properties[k] = jsonSchemaOf(spec);
  return {
    type: "object",
    description: def.description,
    properties,
    required: ["type"],
    additionalProperties: false,
  };
}

/** The JSON schema of a preset, version 1 (`schema/preset.v1.json` is this, checked by a test). */
export function presetSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: PRESET_SCHEMA_ID,
    title: "Forgeron shader preset",
    description:
      "A source and a chain of passes (docs/shaders/design.md). Each pass has a GLSL and a CPU version with the same result.",
    type: "object",
    properties: {
      $schema: { type: "string" },
      version: { const: 1 },
      name: { type: "string" },
      source: { oneOf: Object.entries(SOURCES).map(([t, d]) => stepSchema(t, d)) },
      passes: {
        type: "array",
        items: { oneOf: Object.entries(PASSES).map(([t, d]) => stepSchema(t, d)) },
      },
    },
    required: ["version", "source", "passes"],
    additionalProperties: false,
  };
}
