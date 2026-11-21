import type { CpuPass } from "../contract";
import { perPixel } from "../cpu";
import type { GridParams } from "./grid";

export const gridCpu: CpuPass<GridParams> = {
  type: "grid",
  kind: "present",
  cpu(cells, p, ctx) {
    const frame = perPixel(cells, ctx);
    const { width: w, height: h, data } = frame;
    if (ctx.px < p.min) return frame;
    const edge = 1 - p.gap;
    for (let y = 0; y < h; y++) {
      // The GPU's fragment row, from the bottom.
      const fy = (h - 1 - y + 0.5) / ctx.px;
      const gy = fy - Math.floor(fy) > edge;
      for (let x = 0; x < w; x++) {
        const fx = (x + 0.5) / ctx.px;
        if (!gy && !(fx - Math.floor(fx) > edge)) continue;
        const o = (y * w + x) * 4;
        data[o] = p.tone;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
    return frame;
  },
};
