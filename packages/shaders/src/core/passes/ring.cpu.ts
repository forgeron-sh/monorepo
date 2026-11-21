import { bayer } from "../bayer";
import type { CpuPass } from "../contract";
import type { RingParams } from "./ring";

export const ringCpu: CpuPass<RingParams> = {
  type: "ring",
  kind: "cell",
  usesCell: true,
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    let age = ctx.time - p.start;
    if (age < 0 || !p.tones.length) return;
    if (p.repeat > 0) age %= p.repeat;
    if (age >= p.life) return;
    const radius = age * p.speed * w;
    const left = 1 - age / p.life;
    const n = p.tones.length;
    const tone = p.tones[Math.min(n - 1, Math.floor((age / p.life) * n))] ?? 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x + 0.5 - p.cx * w, y + 0.5 - p.cy * h);
        const k = 1 - Math.abs(d - radius) / p.width;
        if (k > 0 && bayer(x, y, p.matrix) < k * left) data[(y * w + x) * 4] = tone;
      }
  },
};
