import type { SourceDef } from "../contract";

/** A tone function over the cells, `(x, y) → value`, row 0 at the top. */
export type ToneFunction = (x: number, y: number) => number;

/** The value of `data.tone(x, y)` per cell: the ordered dither at build time (`ditherPath`). */
export const toneSource: SourceDef<Record<string, never>> = {
  type: "tone",
  description: "A tone function of the cell, given at run time (CPU only).",
  params: {},
  glsl: null,
  cpu(frame, _p, ctx) {
    const tone = ctx.data?.tone as ToneFunction | undefined;
    const { width: w, height: h, data } = frame;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        data[o] = tone ? tone(x, y) : 0;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
