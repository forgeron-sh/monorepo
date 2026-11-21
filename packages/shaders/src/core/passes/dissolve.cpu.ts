import { bayer } from "../bayer";
import type { CpuPass } from "../contract";
import type { DissolveParams } from "./dissolve";

export const dissolveCpu: CpuPass<DissolveParams> = {
  type: "dissolve",
  kind: "cell",
  usesCell: true,
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    let progress = p.progress;
    if (p.cycle > 0) {
      const ph = (ctx.time / p.cycle) % 1;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      progress = tri * tri * (3 - 2 * tri);
    }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (p.over.length && !p.over.includes(Math.round(data[o] ?? 0))) continue;
        if (bayer(x, y, p.matrix) < progress) data[o] = p.tone;
      }
  },
};
