import type { CpuPass } from "../contract";
import { BLUE_NOISE_SIZE, blueNoiseMask, type BlueNoiseParams } from "./blue-noise";

export const blueNoiseCpu: CpuPass<BlueNoiseParams> = {
  type: "blue-noise",
  kind: "cell",
  usesCell: true,
  cpu(frame, p) {
    const m = blueNoiseMask();
    const N = BLUE_NOISE_SIZE;
    const { width: w, height: h, data } = frame;
    const f = Math.fround;
    const steps = p.steps.map(([o, s]) => [f(o), f(s)] as const);
    for (let y = 0; y < h; y++) {
      const by = (p.origin === "top" ? y : h - 1 - y) % N;
      for (let x = 0; x < w; x++) {
        const t = m[by * N + (x % N)] ?? 0;
        const o = (y * w + x) * 4;
        // The GPU's float32 arithmetic, so both sides agree exactly.
        const v = f(data[o] ?? 0);
        let k = 0;
        while (k < steps.length) {
          const [off, scale] = steps[k] ?? [0, 1];
          if (!(v > f(off + f(t * scale)))) break;
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
