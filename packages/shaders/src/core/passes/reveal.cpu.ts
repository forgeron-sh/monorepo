import { bayer } from "../bayer";
import type { CpuPass } from "../contract";
import type { RevealParams } from "./reveal";

export const revealCpu: CpuPass<RevealParams> = {
  type: "reveal",
  kind: "cell",
  usesCell: true,
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    const clock = p.loop ? ctx.time % (p.duration + p.hold) : ctx.time;
    const progress = Math.min(1, clock / p.duration);
    const fb = p.front.length * p.band;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (Math.round(data[o] ?? 0) === 0) continue;
        const key = ((y + (x + 0.5) / w) / h) * (1 - p.dither) + bayer(x, y, p.matrix) * p.dither;
        const age = progress * (1 + fb) - key;
        if (age < 0) data[o] = 0;
        else if (age < fb)
          data[o] = p.front[Math.min(p.front.length - 1, Math.floor(age / p.band))] ?? 0;
      }
  },
};
