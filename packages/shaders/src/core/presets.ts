import type { BayerSize } from "./bayer";
import type { ColorRef } from "./color";
import { bindChain, type CpuChain, type Preset, type Step } from "./contract";
import { type CpuInputs, runCpu, toSvgPath, toTones } from "./cpu";
import { IMAGE_PALETTE } from "./passes/image-dither";
import { orderedCpu } from "./passes/ordered.cpu";
import { FIELD_TONES } from "./passes/palette";
import type { FieldMode } from "./sources/field";
import { DITHER_FIELD_STEPS, ditherFieldTones, DITHER_FIELD_TONES } from "./dither-field";
import { HEARTH_TONES } from "./sources/hearth";
import { heatCpu } from "./sources/heat.cpu";
import type { ToneFunction } from "./sources/tone";
import { toneCpu } from "./sources/tone.cpu";

/**
 * Today's effects as presets: JSON data, with no definition attached, so that building one costs
 * a page nothing. A mount binds its preset to the one side it runs (`bindChain` with its GLSL or
 * its CPU definitions); `chainOf` binds any preset to every definition. A component is a preset
 * with defaults.
 */

/** A preset of today's effects, without `$schema` (`builtInPresets` adds it). */
export const preset = (name: string, source: Step, passes: Step[]): Preset => ({
  version: 1,
  name,
  source,
  passes,
});

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
export const fieldPreset = (o: FieldPresetOptions): Preset =>
  preset(`field-${o.mode}`, { type: "field", mode: o.mode }, [
    { type: "pixelate", size: o.pixel ?? 4 },
    {
      type: "ordered",
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
    },
    { type: "grid", gap: 0.16, min: 4, tone: 0 },
    { type: "palette", tones: o.tones ?? FIELD_TONES, transparent: [] },
  ]);

const DITHER_FIELD_ORDERED: Step = {
  type: "ordered",
  matrix: 8,
  centered: true,
  origin: "top",
  steps: DITHER_FIELD_STEPS,
};

/**
 * The dither field of the sub-sites' heroes: the heat through the 8×8 Bayer matrix to three
 * tones, one canvas pixel per cell. `tones` are tokens or colours; a token's fallback is the
 * site's dark theme.
 */
export const ditherFieldPreset = (tones: readonly string[] = DITHER_FIELD_TONES): Preset =>
  preset("dither-field", { type: "heat" }, [
    DITHER_FIELD_ORDERED,
    { type: "palette", tones: ditherFieldTones(tones), transparent: [] },
  ]);

/** Tone indices of a dither field frame. */
export const FIELD_BG = 0;
export const FIELD_LOW = 1;
export const FIELD_HIGH = 2;

let toneChain: CpuChain | undefined;

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
  toneChain ??= bindChain(
    preset("dither-field", { type: "heat" }, [DITHER_FIELD_ORDERED]),
    { heat: heatCpu },
    { ordered: orderedCpu },
  );
  return toTones(runCpu(toneChain, w, h, { px: 1, time: t }), out);
}

/** A picture in the palette through the 4×4 Bayer matrix (the site's `data-dither-img`). */
export const ditheredImagePreset = (gain = 1.1, pixel = 3): Preset =>
  preset("dithered-image", { type: "image" }, [
    { type: "pixelate", size: pixel },
    { type: "image-dither", gain, greys: IMAGE_PALETTE.greys.length },
    { type: "palette", tones: [...IMAGE_PALETTE.greys, IMAGE_PALETTE.ember], transparent: [] },
  ]);

/** The hearth's tones; the background is transparent (the page shows through). */
export const hearthPreset = (): Preset =>
  preset("hearth", { type: "hearth" }, [
    { type: "palette", tones: [...HEARTH_TONES], transparent: [0] },
  ]);

const orderedTone = (n: BayerSize): CpuChain =>
  bindChain(
    preset("ordered-tone", { type: "tone" }, [
      { type: "ordered", matrix: n, centered: true, origin: "top", steps: [[0, 1]] },
    ]),
    { tone: toneCpu },
    { ordered: orderedCpu },
  );

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
