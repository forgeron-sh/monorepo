import type { CpuSource } from "../contract";
import { heatLevel } from "./heat";

export const heatCpu: CpuSource<Record<string, never>> = {
  type: "heat",
  cpu(frame, _p, ctx) {
    const { width: w, height: h, data } = frame;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        data[o] = heatLevel(x / w, y / h, ctx.time);
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
