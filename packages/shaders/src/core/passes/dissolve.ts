import type { BayerSize } from "../bayer";
import type { PassMeta } from "../contract";

/**
 * Dissolve: cells switch to one tone, in the order of the Bayer matrix, as `progress` grows from
 * 0 (nothing) to 1 (every cell). The Transition role: dissolve a scene into a transparent tone
 * and the page under the canvas shows through, pixel by pixel; never a fade. With `cycle` above
 * 0 the progress goes there and back every `cycle` seconds (smoothstep) instead of staying put.
 */
export interface DissolveParams {
  /** Tone the dissolved cells take (0 with a transparent palette entry shows what is under). */
  tone: number;
  /** Tones that may dissolve; none listed: all of them. */
  over: readonly number[];
  /** How much has dissolved, 0 to 1 (ignored when `cycle` is set). */
  progress: number;
  /** Seconds for a round trip; 0 holds `progress`. */
  cycle: number;
  matrix: BayerSize;
}

export const dissolveMeta: PassMeta = {
  type: "dissolve",
  kind: "cell",
  usesCell: true,
  description: "Cells switch to one tone in Bayer order as progress grows: a pixel transition.",
  params: {
    tone: { type: "number", default: 0, min: 0, integer: true, description: "Tone taken." },
    over: { type: "indices", default: [], description: "Tones that may dissolve; none: all." },
    progress: { type: "number", default: 0.5, min: 0, max: 1, description: "Share dissolved." },
    cycle: {
      type: "number",
      default: 0,
      min: 0,
      max: 60,
      description: "Seconds for a round trip; 0 holds the progress.",
    },
    matrix: { type: "enum", values: [2, 4, 8], default: 8, description: "Bayer matrix." },
  },
};
