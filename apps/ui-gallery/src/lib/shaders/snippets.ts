// What the pages derive from @forgeron/shaders rather than write by hand: options from a params
// schema, a preset's chain, a step's defaults, the code to mount a preset.

import {
  builtInPresets,
  type ParamSpec,
  type ParamsSchema,
  PASSES,
  type Preset,
  SOURCES,
  type Step,
} from "@forgeron/shaders";
import type { Option, Snippet, StepRef } from "./types";

/** A built-in preset by name; throws on a name the package does not have. */
export function builtIn(name: string): Preset {
  const preset = builtInPresets()[name];
  if (!preset) throw new Error(`no built-in preset "${name}"`);
  return preset;
}

/** The params schema of a step. */
export const schemaOf = (ref: StepRef): ParamsSchema =>
  (ref.on === "source" ? SOURCES[ref.type] : PASSES[ref.type])?.params ?? {};

/** The preset with the first step `ref` names overridden by `params`. */
export function withStep(preset: Preset, ref: StepRef, params: Record<string, unknown>): Preset {
  if (ref.on === "source") return { ...preset, source: { ...preset.source, ...params } };
  const at = preset.passes.findIndex((s) => s.type === ref.type);
  return {
    ...preset,
    passes: preset.passes.map((s, i) => (i === at ? { ...s, ...params } : s)),
  };
}

/** True when the preset has the step. */
export const hasStep = (preset: Preset, ref: StepRef): boolean =>
  ref.on === "source"
    ? preset.source.type === ref.type
    : preset.passes.some((s) => s.type === ref.type);

/** `field → pixelate → ordered → palette`. */
export const chainText = (preset: Preset): string =>
  [preset.source, ...preset.passes].map((s) => s.type).join(" → ");

/** True when every step has GLSL: `mountPreset` runs it on the GPU (as `runsOnGpu` of `/dom`). */
export const runsOnGpu = (preset: Preset): boolean =>
  (SOURCES[preset.source.type]?.glsl ?? null) !== null &&
  preset.passes.every((s) => (PASSES[s.type]?.glsl ?? null) !== null);

/** WebGL when every step has GLSL, else the CPU on a 2D canvas (as `mountPreset` picks). */
export const engineOf = (preset: Preset): string => (runsOnGpu(preset) ? "WebGL" : "Canvas 2D");

const typeOf = (spec: ParamSpec): string =>
  spec.type === "enum"
    ? spec.values.map((v) => JSON.stringify(v)).join(" | ")
    : spec.type === "colors"
      ? "ColorRef[]"
      : spec.type === "indices"
        ? "number[]"
        : spec.type === "steps"
          ? "[offset, scale][]"
          : spec.type;

/** The options of a step, from its params schema (what validates presets). */
export const optionsOf = (ref: StepRef): Option[] =>
  Object.entries(schemaOf(ref)).map(([name, spec]) => ({
    name,
    type: typeOf(spec),
    default: JSON.stringify(spec.default),
    description: spec.description,
  }));

/** The step with every default of its schema: what a preset may write. */
export const defaultStep = (ref: StepRef): Step => ({
  type: ref.type,
  ...Object.fromEntries(Object.entries(schemaOf(ref)).map(([k, s]) => [k, s.default])),
});

/**
 * The JSON of a built-in preset, then how to mount it live and draw it at build time; the JSON
 * only when its source needs data from the page (`json`), which goes through its own mount.
 */
export const presetCode = (name: string, json = false): Snippet[] => [
  {
    title: `Preset "${name}" (builtInPresets())`,
    lang: "tsx",
    code: JSON.stringify(builtIn(name), null, 2),
  },
  ...(json ? [] : presetMount(name)),
];

const presetMount = (name: string): Snippet[] => [
  {
    title: "Plain DOM",
    lang: "tsx",
    code: `import { builtInPresets } from "@forgeron/shaders";
import { mountPreset } from "@forgeron/shaders/dom";

// ${runsOnGpu(builtIn(name)) ? "WebGL2: every step has GLSL." : "On the CPU: a step has no GLSL."} Validated first.
const handle = mountPreset(canvas, builtInPresets()["${name}"]);
// later: handle?.destroy();`,
  },
  {
    title: "Static, at build time",
    lang: "tsx",
    code: `import { builtInPresets, chainOf, runCpu, toRgba } from "@forgeron/shaders";

// The CPU side of every step: RGBA bytes for a PNG, or tone paths for an SVG (toSvgPath).
const rgba = toRgba(runCpu(chainOf(builtInPresets()["${name}"]), 320, 200, { time: 1.7 }));`,
  },
];

/** A preset driven by the page (`front` with `driven`): the scroll sets its progress. */
export const drivenCode = (name: string): Snippet => ({
  title: "Driven by the page (the scroll, a clock)",
  lang: "tsx",
  code: `import { builtInPresets } from "@forgeron/shaders";
import { mountPreset } from "@forgeron/shaders/dom";

// Progress comes from the page: the preset redraws when it is set.
const preset = builtInPresets()["${name}"];
const handle = mountPreset(canvas, { ...preset, source: { ...preset.source, driven: true } });
addEventListener("scroll", () => handle?.set({ progress: scrollY / innerHeight }));`,
});
