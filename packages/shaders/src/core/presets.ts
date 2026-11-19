import type { BayerSize } from "./bayer";
import type { ColorRef } from "./color";
import { bindPass, bindSource, type Chain, type Preset, toPreset } from "./contract";
import { type CpuInputs, runCpu, toSvgPath, toTones } from "./cpu";
import { gridPass } from "./passes/grid";
import { IMAGE_PALETTE, imageDitherPass } from "./passes/image-dither";
import { orderedPass } from "./passes/ordered";
import { FIELD_TONES, palettePass } from "./passes/palette";
import { pixelatePass } from "./passes/pixelate";
import { type FieldMode, fieldSource } from "./sources/field";
import { HEARTH_TONES, hearthSource } from "./sources/hearth";
import { heatSource } from "./sources/heat";
import { imageSource } from "./sources/image";
import { type ToneFunction, toneSource } from "./sources/tone";

/**
 * Today's effects as chains (what each mount runs, importing only its own passes) and as presets
 * (`toPreset`, JSON). A component is a preset with defaults.
 */

export interface FieldPresetOptions {
  mode: FieldMode;
  /** Side of one cell in CSS pixels (4 by default). */
  pixel?: number;
  /** `false` draws the brightest cells in ink instead of the ember. */
  accent?: boolean;
  /** The three tones: background, ink, ember. */
  tones?: readonly [ColorRef, ColorRef, ColorRef];
}

/** A generator field of forgeron.sh, as the site's shader draws it. */
export function fieldChain(o: FieldPresetOptions): Chain {
  return {
    name: `field-${o.mode}`,
    source: bindSource(fieldSource, { mode: o.mode }),
    passes: [
      bindPass(pixelatePass, { size: o.pixel ?? 4 }),
      bindPass(orderedPass, {
        matrix: 8,
        centered: false,
        origin: "bottom",
        steps:
          o.accent === false
            ? [[0, 1]]
            : [
                [0, 1],
                [0.86, 0.12],
              ],
      }),
      bindPass(gridPass, { gap: 0.16, min: 4, tone: 0 }),
      bindPass(palettePass, { tones: o.tones ?? FIELD_TONES, transparent: [] }),
    ],
  };
}

export const fieldPreset = (o: FieldPresetOptions): Preset => toPreset(fieldChain(o));

/** The dither field's tones by default: background, a strong line, the ember. */
export const DITHER_FIELD_TONES = ["--bg", "--line-strong", "--accent"] as const;
const DITHER_FIELD_FALLBACKS = ["#0a0a0a", "#2e2e2e", "#ff4f1f"] as const;

const ditherFieldOrdered = /* @__PURE__ */ bindPass(orderedPass, {
  matrix: 8,
  centered: true,
  origin: "top",
  steps: [
    [0, 0.9],
    [0.45, 1],
  ],
});

/**
 * The dither field of the sub-sites' heroes: the heat through the 8×8 Bayer matrix to three
 * tones, one canvas pixel per cell. `tones` are tokens or colours; a token's fallback is the
 * site's dark theme.
 */
export function ditherFieldChain(tones: readonly string[] = DITHER_FIELD_TONES): Chain {
  return {
    name: "dither-field",
    source: bindSource(heatSource, {}),
    passes: [
      ditherFieldOrdered,
      bindPass(palettePass, {
        tones: tones.map((t, i) =>
          t.startsWith("--") ? { var: t, fallback: DITHER_FIELD_FALLBACKS[i] ?? "#000" } : t,
        ),
        transparent: [],
      }),
    ],
  };
}

export const ditherFieldPreset = (tones?: readonly string[]): Preset =>
  toPreset(ditherFieldChain(tones));

/** Tone indices of a dither field frame. */
export const FIELD_BG = 0;
export const FIELD_LOW = 1;
export const FIELD_HIGH = 2;

const DITHER_FIELD_TONE_CHAIN: Chain = {
  source: /* @__PURE__ */ bindSource(heatSource, {}),
  passes: [ditherFieldOrdered],
};

/**
 * One frame of `w`×`h` cells of the dither field at `t` seconds, as tone indices, row by row.
 * Deterministic: the same arguments give the same frame.
 */
export function ditherFieldFrame(
  w: number,
  h: number,
  t: number,
  out = new Uint8Array(w * h),
): Uint8Array {
  return toTones(runCpu(DITHER_FIELD_TONE_CHAIN, w, h, { px: 1, time: t }), out);
}

/** A picture in the palette through the 4×4 Bayer matrix (the site's `data-dither-img`). */
export function ditheredImageChain(gain = 1.1, pixel = 3): Chain {
  return {
    name: "dithered-image",
    source: bindSource(imageSource, {}),
    passes: [
      bindPass(pixelatePass, { size: pixel }),
      bindPass(imageDitherPass, { gain, greys: IMAGE_PALETTE.greys.length }),
      bindPass(palettePass, {
        tones: [...IMAGE_PALETTE.greys, IMAGE_PALETTE.ember],
        transparent: [],
      }),
    ],
  };
}

export const ditheredImagePreset = (gain?: number, pixel?: number): Preset =>
  toPreset(ditheredImageChain(gain, pixel));

/** The hearth's tones; the background is transparent (the page shows through). */
export function hearthChain(): Chain {
  return {
    name: "hearth",
    source: bindSource(hearthSource, {}),
    passes: [bindPass(palettePass, { tones: [...HEARTH_TONES], transparent: [0] })],
  };
}

export const hearthPreset = (): Preset => toPreset(hearthChain());

const orderedTone = (n: BayerSize): Chain => ({
  source: bindSource(toneSource, {}),
  passes: [bindPass(orderedPass, { matrix: n, centered: true, origin: "top", steps: [[0, 1]] })],
});

/**
 * The ordered dither at build time: a tone function over a grid becomes the path of the cells
 * drawn, one unit each (viewBox `0 0 cols rows`). A cell is drawn when its tone is above the
 * Bayer threshold of its position. Static SVG: no canvas, no JavaScript.
 */
export function ditherPath(
  cols: number,
  rows: number,
  tone: ToneFunction,
  n: BayerSize = 8,
  inputs: CpuInputs = {},
): string {
  return toSvgPath(runCpu(orderedTone(n), cols, rows, { ...inputs, px: 1, data: { tone } }));
}

/**
 * The built-in presets, by name (the gallery and, later, the editor list them). A function, so
 * a page that mounts one effect does not bundle the others.
 */
export function builtInPresets(): Record<string, Preset> {
  return {
    "field-ember": fieldPreset({ mode: "ember" }),
    "field-globe": fieldPreset({ mode: "globe" }),
    "field-dissolve": fieldPreset({ mode: "dissolve" }),
    "field-field": fieldPreset({ mode: "field", accent: false }),
    "dither-field": ditherFieldPreset(),
    "dithered-image": ditheredImagePreset(),
    hearth: hearthPreset(),
  };
}
