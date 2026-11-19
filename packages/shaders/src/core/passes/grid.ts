import type { PassMeta } from "../contract";

export interface GridParams {
  /** Share of each cell left as a gap on its right and top edges. */
  gap: number;
  /** No gap below this many device pixels per cell. */
  min: number;
  /** The tone index the gap takes (0, the background). */
  tone: number;
}

/**
 * The pixel grid: a gap on the right and top edge of each cell, in output pixels (the last
 * stage). It writes a tone index, so it runs before the palette.
 */
export const gridMeta: PassMeta = {
  type: "grid",
  kind: "present",
  description: "A gap on the right and top edge of each cell, in output pixels.",
  params: {
    gap: { type: "number", default: 0.16, min: 0, max: 0.5, description: "Share of a cell." },
    min: {
      type: "number",
      default: 4,
      min: 0,
      description: "No gap below this many device pixels per cell.",
    },
    tone: { type: "number", default: 0, min: 0, integer: true, description: "Tone of the gap." },
  },
};
