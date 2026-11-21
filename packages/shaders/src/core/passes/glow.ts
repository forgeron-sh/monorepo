import type { BayerSize } from "../bayer";
import type { PassMeta } from "../contract";

/**
 * Glow: a dithered halo around the cells of the glowing tones (the ember), on tone indices,
 * before the palette, as Blueprint's glow. The share of glowing cells around a cell, weighted by
 * a binomial kernel of `radius` (separable: a horizontal then a vertical sum, two stages on the
 * GPU), times `strength`, against the Bayer threshold of the cell: above it, a cell of an `over`
 * tone takes the halo's `tone`. The sums are whole numbers and the kernel's total a power of two,
 * so the CPU (rounding as float32) and the GPU agree exactly.
 */

export interface GlowParams {
  /** Tones that glow. */
  tones: readonly number[];
  /** Tones the halo may cover (the background). */
  over: readonly number[];
  /** Tone of the halo. */
  tone: number;
  /** Reach of the halo, in cells. */
  radius: number;
  /** Density of the halo next to its source (1: as dense as the share of glowing cells). */
  strength: number;
  /** Side of the Bayer matrix that dithers the halo. */
  matrix: BayerSize;
}

export const glowMeta: PassMeta = {
  type: "glow",
  kind: "neighbourhood",
  usesCell: true,
  description: "A dithered halo around the glowing tones (binomial kernel, two passes).",
  params: {
    tones: { type: "indices", default: [2], description: "Tones that glow." },
    over: { type: "indices", default: [0], description: "Tones the halo may cover." },
    tone: { type: "number", default: 2, min: 0, integer: true, description: "Tone of the halo." },
    radius: {
      type: "number",
      default: 2,
      min: 1,
      max: 6,
      integer: true,
      description: "Reach, in cells.",
    },
    strength: { type: "number", default: 1.5, min: 0, max: 8, description: "Density." },
    matrix: { type: "enum", values: [2, 4, 8], default: 4, description: "Bayer matrix." },
  },
};

/** Binomial weights `C(2r, k)`, `k = 0..2r`; they sum to `4^r`. */
export function binomial(radius: number): number[] {
  let row = [1];
  for (let i = 0; i < 2 * radius; i++) {
    const next = [1];
    for (let j = 1; j < row.length; j++) next.push((row[j - 1] ?? 0) + (row[j] ?? 0));
    next.push(1);
    row = next;
  }
  return row;
}
