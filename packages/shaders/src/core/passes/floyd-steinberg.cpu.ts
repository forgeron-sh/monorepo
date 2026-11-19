import type { CpuPass } from "../contract";
import type { FloydSteinbergParams } from "./floyd-steinberg";

export const floydSteinbergCpu: CpuPass<FloydSteinbergParams> = {
  type: "floyd-steinberg",
  kind: "neighbourhood",
  usesCell: true,
  cpu(frame, p) {
    const { width: w, height: h, data } = frame;
    const last = p.levels - 1;
    const err = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) err[i] = (data[i * 4] ?? 0) * last;
    for (let y = 0; y < h; y++) {
      const back = p.serpentine && y % 2 === 1;
      const dir = back ? -1 : 1;
      for (let n = 0; n < w; n++) {
        const x = back ? w - 1 - n : n;
        const i = y * w + x;
        const v = err[i] ?? 0;
        const q = Math.min(last, Math.max(0, Math.round(v)));
        const e = v - q;
        const spread = (dx: number, dy: number, k: number) => {
          const nx = x + dx * dir;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny < h)
            err[ny * w + nx] = (err[ny * w + nx] ?? 0) + (e * k) / 16;
        };
        spread(1, 0, 7);
        spread(-1, 1, 3);
        spread(0, 1, 5);
        spread(1, 1, 1);
        const o = i * 4;
        data[o] = q;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
