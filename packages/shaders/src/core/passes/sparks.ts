import type { PassMeta } from "../contract";

/**
 * Sparks: embers along the edge of a `front` and a few flying off it, on a slow tick so the edge
 * glows rather than fizzes. Reads the front's distance (`g`) and life (`b`), writes a level in `r`
 * for the ordered dither after it (`tones` are levels above 1, which that dither turns into the
 * tones above the picture's). Cells within a few cells of the edge catch with a chance that falls
 * with their depth; the hash is an integer one, the same bits on the GPU and the CPU.
 */
export interface SparksParams {
  /** Seconds between two draws of the embers. */
  tick: number;
  /** How deep inside the edge the embers centre, in cells. */
  offset: number;
  /** How far a travelling wave moves them, in cells. */
  wobble: number;
  /** Chance of an ember on the nearest layer (and less deeper in), 0 to 1. */
  density: number;
  /** Chance lost per layer towards the edge. */
  falloff: number;
  /** Chance per cell outside the edge of a flying spark, 0 to 1. */
  fly: number;
  /** How far outside a spark may fly, in cells. */
  reach: number;
  /** The levels written: outermost layers, middle, innermost (and the sparks, middle or inner). */
  tones: readonly number[];
}

export const sparksMeta: PassMeta = {
  type: "sparks",
  kind: "cell",
  usesCell: true,
  description: "Embers and flying sparks along the edge of a front.",
  params: {
    tick: { type: "number", default: 0.18, min: 0.02, max: 5, description: "Seconds per draw." },
    offset: { type: "number", default: 6, min: 0, max: 32, description: "Ember depth, cells." },
    wobble: { type: "number", default: 1, min: 0, max: 8, description: "Wave amplitude, cells." },
    density: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      description: "Chance, nearest layer.",
    },
    falloff: {
      type: "number",
      default: 0.07,
      min: 0,
      max: 0.5,
      description: "Chance lost a layer.",
    },
    fly: { type: "number", default: 0.003, min: 0, max: 0.1, description: "Flying spark chance." },
    reach: { type: "number", default: 10, min: 1, max: 40, description: "Flight distance, cells." },
    tones: {
      type: "indices",
      default: [2, 3, 4],
      description: "Levels written: outer, middle, inner.",
    },
  },
};
