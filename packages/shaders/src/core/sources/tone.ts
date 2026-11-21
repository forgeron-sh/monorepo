import type { SourceMeta } from "../contract";

/** A tone function over the cells, `(x, y) → value`, row 0 at the top. */
export type ToneFunction = (x: number, y: number) => number;

/** The value of `data.tone(x, y)` per cell: the ordered dither at build time (`ditherPath`). */
export const toneMeta: SourceMeta = {
  type: "tone",
  description: "A tone function of the cell, given at run time (CPU only).",
  params: {},
};
