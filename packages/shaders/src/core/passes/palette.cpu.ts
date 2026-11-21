import type { CpuPass } from "../contract";
import type { PaletteParams } from "./palette";

export const paletteCpu: CpuPass<PaletteParams> = {
  type: "palette",
  kind: "cell",
  cpu(frame, p, ctx) {
    const colors = p.tones.map((ref) => ctx.resolve(ref));
    const last = colors.length - 1;
    const { data } = frame;
    for (let o = 0; o < data.length; o += 4) {
      const i = Math.min(last, Math.max(0, Math.round(data[o] ?? 0)));
      const c = colors[i] ?? [0, 0, 0];
      data[o] = c[0] / 255;
      data[o + 1] = c[1] / 255;
      data[o + 2] = c[2] / 255;
      data[o + 3] = p.transparent.includes(i) ? 0 : 1;
    }
  },
};
