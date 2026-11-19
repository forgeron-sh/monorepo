import type { CpuPass, Frame } from "../contract";
import { valueAt } from "../cpu";
import type { EdgesParams } from "./edges";

export const edgesCpu: CpuPass<EdgesParams> = {
  type: "edges",
  kind: "neighbourhood",
  usesCell: true,
  cpu(frame, p) {
    const src: Frame = { ...frame, data: frame.data.slice() };
    const { width: w, height: h, data } = frame;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Row y - 1 is the GPU's y + 1 (rows from the top here).
        const v = (dx: number, dy: number) => valueAt(src, x + dx, y - dy);
        const gx = v(1, 1) + 2 * v(1, 0) + v(1, -1) - (v(-1, 1) + 2 * v(-1, 0) + v(-1, -1));
        const gy = v(-1, 1) + 2 * v(0, 1) + v(1, 1) - (v(-1, -1) + 2 * v(0, -1) + v(1, -1));
        const o = (y * w + x) * 4;
        data[o] = Math.min(1, Math.sqrt(gx * gx + gy * gy) * p.scale);
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
