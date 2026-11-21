import type { PassMeta } from "../contract";

/**
 * Hatch: diagonal stripes of whole cells over chosen tones, drifting with time: the hatched rails
 * of the landing, as a pass (the Progress and Selection roles). On tone indices, before the
 * palette. Cell `(x, y)` (row 0 at the top) is striped when `(x ± y + ⌊time × speed⌋) mod period`
 * is under `width`. An integer test: the CPU and the GPU agree exactly (time held fixed).
 */
export interface HatchParams {
  /** Tone of the stripes. */
  tone: number;
  /** Tones the stripes may cover. */
  over: readonly number[];
  /** Cells between the starts of two stripes, measured along a row. */
  period: number;
  /** Cells of a stripe, along a row. */
  width: number;
  /** Cells the pattern drifts per second (0: still). */
  speed: number;
  /** Direction of the stripes: `down` leans right going down, `up` the other way. */
  direction: "down" | "up";
  /** The area the stripes fill, as shares of the frame (y from the top). */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export const hatchMeta: PassMeta = {
  type: "hatch",
  kind: "cell",
  usesCell: true,
  description: "Diagonal stripes of whole cells over chosen tones, drifting with time.",
  params: {
    tone: {
      type: "number",
      default: 1,
      min: 0,
      integer: true,
      description: "Tone of the stripes.",
    },
    over: { type: "indices", default: [0], description: "Tones the stripes may cover." },
    period: {
      type: "number",
      default: 4,
      min: 2,
      max: 64,
      integer: true,
      description: "Cells between two stripes.",
    },
    width: {
      type: "number",
      default: 2,
      min: 1,
      max: 63,
      integer: true,
      description: "Cells of a stripe.",
    },
    speed: { type: "number", default: 0, min: -60, max: 60, description: "Cells per second." },
    direction: {
      type: "enum",
      values: ["down", "up"],
      default: "down",
      description: "Lean of the stripes.",
    },
    x0: { type: "number", default: 0, min: 0, max: 1, description: "Left edge of the area." },
    x1: { type: "number", default: 1, min: 0, max: 1, description: "Right edge of the area." },
    y0: { type: "number", default: 0, min: 0, max: 1, description: "Top edge of the area." },
    y1: { type: "number", default: 1, min: 0, max: 1, description: "Bottom edge of the area." },
  },
};
