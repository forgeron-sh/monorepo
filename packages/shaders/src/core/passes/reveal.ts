import type { BayerSize } from "../bayer";
import type { PassMeta } from "../contract";

/**
 * Reveal: tone indices appear along a front that sweeps the rows from the top, left to right in
 * each row, jittered by the Bayer matrix; on the way a cell wears the `front` tones one after the
 * other before it settles in its own. The Title role. The cell-local form of the font
 * specimen's reveal (`mountReveal`, which also shifts pixels with a wave and keeps its own
 * mount). Cells of tone 0 stay empty. With `loop` the sweep restarts after `hold` seconds.
 * Float timing: the CPU and the GPU agree within a stated share of cells.
 */
export interface RevealParams {
  /** Seconds the sweep takes. */
  duration: number;
  /** Seconds the settled text stays before a loop restarts. */
  hold: number;
  loop: boolean;
  /** Tones a cell wears at the front, newest first. */
  front: readonly number[];
  /** Share of the sweep each front tone lasts. */
  band: number;
  /** Share of the timing given to the Bayer jitter. */
  dither: number;
  matrix: BayerSize;
}

export const revealMeta: PassMeta = {
  type: "reveal",
  kind: "cell",
  usesCell: true,
  description: "Tones appear along a Bayer-jittered front that scans the rows.",
  params: {
    duration: { type: "number", default: 1.5, min: 0.1, max: 30, description: "Seconds of sweep." },
    hold: { type: "number", default: 1.5, min: 0, max: 60, description: "Seconds settled." },
    loop: { type: "boolean", default: false, description: "Restart after the hold." },
    front: { type: "indices", default: [3, 2], description: "Tones worn at the front." },
    band: { type: "number", default: 0.06, min: 0.005, max: 0.5, description: "Share per tone." },
    dither: { type: "number", default: 0.12, min: 0, max: 1, description: "Bayer jitter." },
    matrix: { type: "enum", values: [2, 4, 8], default: 8, description: "Bayer matrix." },
  },
};
