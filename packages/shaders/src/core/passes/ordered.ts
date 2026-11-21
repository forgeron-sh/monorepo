import type { BayerSize } from "../bayer";
import type { PassMeta } from "../contract";

export interface OrderedParams {
  matrix: BayerSize;
  /** Thresholds at `(m + 0.5) / n²` (the CPU effects) or `m / n²` (the site's field shader). */
  centered: boolean;
  /** Which row the matrix starts on: the top (CPU effects) or the bottom (GPU fields). */
  origin: "top" | "bottom";
  /** `[offset, scale]`: tone k is the number of consecutive steps with `v > offset + t × scale`. */
  steps: readonly (readonly [number, number])[];
}

/**
 * Ordered dither: the value in `r` against the Bayer threshold of the cell becomes a tone index
 * (0 below the first step). Integer result: the CPU and the GPU agree exactly.
 */
export const orderedMeta: PassMeta = {
  type: "ordered",
  kind: "cell",
  usesCell: true,
  description: "Ordered (Bayer) dither of the value into tone indices.",
  params: {
    matrix: {
      type: "enum",
      values: [2, 4, 8],
      default: 8,
      description: "Side of the Bayer matrix.",
    },
    centered: {
      type: "boolean",
      default: true,
      description: "Thresholds at (m + 0.5) / n² instead of m / n².",
    },
    origin: {
      type: "enum",
      values: ["top", "bottom"],
      default: "top",
      description: "Row the matrix starts on.",
    },
    steps: {
      type: "steps",
      default: [[0, 1]],
      description:
        "[offset, scale] per tone above the background: tone k when the value passes k consecutive steps.",
    },
  },
};
