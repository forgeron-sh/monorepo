import type { CpuPass } from "../contract";
import { halftoneConstants, type HalftoneParams } from "./halftone";

export const halftoneCpu: CpuPass<HalftoneParams> = {
  type: "halftone",
  kind: "cell",
  usesCell: true,
  cpu(frame, p) {
    const [C, S, inv] = halftoneConstants(p);
    const { width: w, height: h, data } = frame;
    for (let y = 0; y < h; y++) {
      const qy = h - 1 - y + 0.5;
      for (let x = 0; x < w; x++) {
        const qx = x + 0.5;
        const rx = (qx * C + qy * S) * inv;
        const ry = (qy * C - qx * S) * inv;
        const dx = rx - Math.floor(rx) - 0.5;
        const dy = ry - Math.floor(ry) - 0.5;
        const o = (y * w + x) * 4;
        data[o] = dx * dx + dy * dy < (data[o] ?? 0) * 0.5 ? p.tone : 0;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
