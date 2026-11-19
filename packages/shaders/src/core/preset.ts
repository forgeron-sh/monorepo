import {
  type Chain,
  type PassDef,
  PRESET_SCHEMA_ID,
  type Preset,
  type SourceDef,
  type Step,
} from "./contract";
import { jsonSchemaOf, type PresetIssue, readParams } from "./params";
import { gridPass } from "./passes/grid";
import { imageDitherPass } from "./passes/image-dither";
import { orderedPass } from "./passes/ordered";
import { palettePass } from "./passes/palette";
import { pixelatePass } from "./passes/pixelate";
import { fieldSource } from "./sources/field";
import { hearthSource } from "./sources/hearth";
import { heatSource } from "./sources/heat";
import { imageSource } from "./sources/image";
import { toneSource } from "./sources/tone";

/**
 * Presets: an effect as data (docs/shaders/design.md §3). `version: 1`; the schema is
 * `schema/preset.v1.json`, written from the params of the passes and sources below.
 */

/** The passes a preset may use, by type. */
export const PASSES: Readonly<Record<string, PassDef<never>>> = {
  pixelate: pixelatePass,
  ordered: orderedPass,
  "image-dither": imageDitherPass,
  palette: palettePass,
  grid: gridPass,
} as Record<string, PassDef<never>>;

/** The sources a preset may start from, by type. */
export const SOURCES: Readonly<Record<string, SourceDef<never>>> = {
  field: fieldSource,
  heat: heatSource,
  image: imageSource,
  tone: toneSource,
  hearth: hearthSource,
} as Record<string, SourceDef<never>>;

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
    let present = false;
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
        issues.push({ path, message: `"${raw.type}" reads cells and cannot follow the grid` });
      present ||= def.kind === "present";
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

/** The chain of a preset (checked first: throws a `PresetError`). */
export function chainOf(input: Preset | unknown): Chain {
  const preset = readPreset(input);
  const { type: sourceType, ...sourceParams } = preset.source;
  const chain: Chain = {
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
  def: { description: string; params: PassDef["params"] },
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
