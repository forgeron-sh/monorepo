import type { CpuPass } from "../contract";
import type { ScanlinesParams } from "./scanlines";

export const scanlinesCpu: CpuPass<ScanlinesParams> = {
  type: "scanlines",
  kind: "cell",
  usesCell: true,
  cpu(frame, p) {
    const { width: w, height: h, data } = frame;
    const k = Math.fround(1 - p.strength);
    for (let y = 0; y < h; y++) {
      if ((p.origin === "top" ? y : h - 1 - y) % p.period >= p.width) continue;
      for (let o = y * w * 4; o < (y + 1) * w * 4; o += 4) {
        data[o] = Math.fround((data[o] ?? 0) * k);
        data[o + 1] = Math.fround((data[o + 1] ?? 0) * k);
        data[o + 2] = Math.fround((data[o + 2] ?? 0) * k);
      }
    }
  },
};
