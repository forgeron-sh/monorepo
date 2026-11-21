import type { CpuPass } from "../contract";
import type { HatchParams } from "./hatch";

export const hatchCpu: CpuPass<HatchParams> = {
  type: "hatch",
  kind: "cell",
  usesCell: true,
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    const drift = Math.floor(ctx.time * p.speed);
    const lean = p.direction === "down" ? 1 : -1;
    for (let y = 0; y < h; y++) {
      const fy = (y + 0.5) / h;
      if (fy < p.y0 || fy >= p.y1) continue;
      for (let x = 0; x < w; x++) {
        const fx = (x + 0.5) / w;
        if (fx < p.x0 || fx >= p.x1) continue;
        const o = (y * w + x) * 4;
        const tone = Math.round(data[o] ?? 0);
        if (!p.over.includes(tone)) continue;
        const k = (((x + lean * y + drift) % p.period) + p.period) % p.period;
        if (k < p.width) data[o] = p.tone;
      }
    }
  },
};
