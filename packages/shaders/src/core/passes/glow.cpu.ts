import { bayer } from "../bayer";
import type { CpuPass } from "../contract";
import { binomial, type GlowParams } from "./glow";

export const glowCpu: CpuPass<GlowParams> = {
  type: "glow",
  kind: "neighbourhood",
  usesCell: true,
  cpu(frame, p) {
    const { width: w, height: h, data } = frame;
    const r = p.radius;
    const k = binomial(r);
    const tone = (i: number) => Math.round(data[i * 4] ?? 0);
    const glowing = new Set(p.tones);
    const over = new Set(p.over);
    const row = new Float64Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let d = -r; d <= r; d++) {
          const xx = Math.min(w - 1, Math.max(0, x + d));
          if (glowing.has(tone(y * w + xx))) s += k[d + r] ?? 0;
        }
        row[y * w + x] = s;
      }
    const total = 4 ** (2 * r);
    const strength = Math.fround(p.strength);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let d = -r; d <= r; d++) {
          // The GPU's +d is up: a row above here.
          const yy = Math.min(h - 1, Math.max(0, y - d));
          s += (k[d + r] ?? 0) * (row[yy * w + x] ?? 0);
        }
        const i = y * w + x;
        let t = tone(i);
        if (over.has(t) && Math.fround((s / total) * strength) > bayer(x, y, p.matrix)) t = p.tone;
        const o = i * 4;
        data[o] = t;
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
  },
};
