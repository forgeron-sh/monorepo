import { bayer, matrix } from "../bayer";
import type { CpuPass } from "../contract";
import type { OrderedParams } from "./ordered";

export const orderedCpu: CpuPass<OrderedParams> = {
  type: "ordered",
  kind: "cell",
  usesCell: true,
  cpu(frame, p) {
    const { width: w, height: h, data } = frame;
    const n = p.matrix;
    const m = matrix(n);
    const steps = p.steps;
    for (let y = 0; y < h; y++) {
      const by = p.origin === "top" ? y : h - 1 - y;
      for (let x = 0; x < w; x++) {
        const t = p.centered
          ? bayer(x, by, n)
          : (m[(by & (n - 1)) * n + (x & (n - 1))] ?? 0) / (n * n);
        const o = (y * w + x) * 4;
        const v = data[o] ?? 0;
        let k = 0;
        while (k < steps.length) {
          const [off, scale] = steps[k] ?? [0, 1];
          if (!(v > off + t * scale)) break;
          k++;
        }
        data[o] = k;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
