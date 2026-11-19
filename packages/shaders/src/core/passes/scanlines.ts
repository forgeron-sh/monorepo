import type { PassMeta } from "../contract";

/**
 * Scanlines: every `period` rows of cells, `width` rows are darkened by `strength`. On colours
 * (after the palette) or on the value (before a dither). The rows are whole cells, so the lines
 * are the pixel grid's; the darkening is a float product, so a byte may round differently on the
 * GPU (stated tolerance).
 */

export interface ScanlinesParams {
  /** One line every this many rows of cells. */
  period: number;
  /** Rows of cells a line takes. */
  width: number;
  /** How much darker a line is, 0 to 1. */
  strength: number;
  /** Which row the lines are counted from. */
  origin: "top" | "bottom";
}

export const scanlinesMeta: PassMeta = {
  type: "scanlines",
  kind: "cell",
  usesCell: true,
  description: "Darker rows of cells every few rows.",
  params: {
    period: { type: "number", default: 3, min: 2, integer: true, description: "Rows per line." },
    width: { type: "number", default: 1, min: 1, integer: true, description: "Rows a line takes." },
    strength: { type: "number", default: 0.5, min: 0, max: 1, description: "Darkening, 0 to 1." },
    origin: {
      type: "enum",
      values: ["top", "bottom"],
      default: "top",
      description: "Row the lines are counted from.",
    },
  },
};
