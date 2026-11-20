import type { BayerSize } from "../bayer";
import type { PassMeta } from "../contract";

/**
 * Ring: a ring of pixels that spreads from a point and dies out, then nothing. The Feedback role
 * (a click, a success, an error). On tone indices, before the palette. The ring's radius grows
 * with the age `time − start` (modulo `repeat` when it repeats); a cell within `width` cells of
 * it is drawn where the Bayer threshold is under its closeness to the ring times the life left,
 * in the tone of the age's slice of `tones`. Float distances: the CPU and the GPU agree within a
 * stated share of cells.
 */
export interface RingParams {
  /** Centre, as shares of the frame (y from the top). */
  cx: number;
  cy: number;
  /** Radius gained per second, as a share of the frame's width. */
  speed: number;
  /** Half thickness, in cells. */
  width: number;
  /** Second the ring starts at. */
  start: number;
  /** Seconds the ring lives. */
  life: number;
  /** Seconds between two rings; 0: once. */
  repeat: number;
  /** Tones of the ring from its birth to its end, one slice of its life each. */
  tones: readonly number[];
  matrix: BayerSize;
}

export const ringMeta: PassMeta = {
  type: "ring",
  kind: "cell",
  usesCell: true,
  description: "A ring of whole pixels that spreads from a point and dies out.",
  params: {
    cx: { type: "number", default: 0.5, min: 0, max: 1, description: "Centre, left to right." },
    cy: { type: "number", default: 0.5, min: 0, max: 1, description: "Centre, top to bottom." },
    speed: { type: "number", default: 0.45, min: 0, max: 4, description: "Width per second." },
    width: { type: "number", default: 2.5, min: 0.5, max: 16, description: "Half thickness." },
    start: { type: "number", default: 0, description: "Second it starts at." },
    life: { type: "number", default: 1, min: 0.1, max: 30, description: "Seconds it lives." },
    repeat: { type: "number", default: 0, min: 0, max: 600, description: "Seconds between rings." },
    tones: { type: "indices", default: [3, 2, 1], description: "Tone per slice of its life." },
    matrix: { type: "enum", values: [2, 4, 8], default: 8, description: "Bayer matrix." },
  },
};
