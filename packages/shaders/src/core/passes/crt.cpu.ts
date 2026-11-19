import { type CpuPass, createFrame } from "../contract";
import { valueAt } from "../cpu";
import type { CrtParams } from "./crt";

export const crtCpu: CpuPass<CrtParams> = {
  type: "crt",
  kind: "present",
  cut: true,
  usesCell: true,
  cpu(cells, p, ctx) {
    const [W, H] = ctx.res;
    const out = createFrame(W, H);
    const rows = cells.height;
    const keep = 1 - p.mask;
    for (let y = 0; y < H; y++) {
      const fy = H - 1 - y + 0.5;
      for (let x = 0; x < W; x++) {
        const fx = x + 0.5;
        const qx = (fx / W) * 2 - 1;
        const qy = (fy / H) * 2 - 1;
        const r2 = qx * qx + qy * qy;
        const ux = qx * (1 + p.curvature * r2) * 0.5 + 0.5;
        const uy = qy * (1 + p.curvature * r2) * 0.5 + 0.5;
        const o = (y * W + x) * 4;
        out.data[o + 3] = 1;
        if (ux < 0 || ux >= 1 || uy < 0 || uy >= 1) continue;
        const sx = Math.floor((ux * W) / ctx.px);
        // The cell's row from the bottom, as a row of the frame from the top.
        const sy = rows - 1 - Math.floor((uy * H) / ctx.px);
        const col = Math.floor(fx) % 3;
        const dim = 1 - p.vignette * r2 * 0.5;
        for (let ch = 0; ch < 3; ch++) {
          let m = 0;
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) m += valueAt(cells, sx + i, sy - j, ch);
          const v = valueAt(cells, sx, sy, ch) + (p.bloom * m) / 9;
          out.data[o + ch] = Math.min(v * (col === ch ? 1 : keep) * dim, 1);
        }
      }
    }
    return out;
  },
};
