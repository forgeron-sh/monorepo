import type { CpuPass } from "../contract";
import type { SparksParams } from "./sparks";

/** The integer hash of the burns, 24 bits: exact in float32, so the GPU's copy agrees bit for bit. */
export function hash24(a: number, b: number, c: number): number {
  let h =
    (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 8) / 16777216;
}

export const sparksCpu: CpuPass<SparksParams> = {
  type: "sparks",
  kind: "cell",
  usesCell: true,
  cpu(frame, p, ctx) {
    const { width: w, height: h, data } = frame;
    const tick = Math.floor(ctx.time / p.tick);
    const [outer = 2, middle = 3, inner = 4] = p.tones;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        const life = data[o + 2] ?? 0;
        if (life <= 0) continue;
        const g = data[o + 1] ?? 0;
        if (g >= 0) {
          const u = x + y;
          const wave =
            (Math.sin(u * 0.2 + ctx.time * 1.2) * 0.75 +
              Math.sin(u * 0.07 - ctx.time * 0.6) * 1.25) *
            p.wobble;
          const d = Math.floor(p.offset - wave - g + 0.5);
          if (d >= -2 && d <= 4 && hash24(x, y, tick) < (p.density - d * p.falloff) * life)
            data[o] = d < 0 ? outer : d < 2 ? middle : inner;
        } else if (g > -p.reach && hash24(x, y + 4096, tick) < p.fly * life) {
          data[o] = hash24(x, y + 8192, tick) < 0.5 ? middle : inner;
        }
      }
  },
};
