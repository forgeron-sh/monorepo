import type { CpuSource } from "../contract";
import type { ToneFunction } from "./tone";

export const toneCpu: CpuSource<Record<string, never>> = {
  type: "tone",
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
