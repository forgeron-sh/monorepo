import type { CpuPass } from "../contract";
import { type ImageDitherParams, imageTone } from "./image-dither";

export const imageDitherCpu: CpuPass<ImageDitherParams> = {
  type: "image-dither",
  kind: "cell",
  usesCell: true,
  cpu(frame, p) {
    const { width: w, height: h, data } = frame;
    const last = p.greys - 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        const byte = (i: number) => Math.round((data[o + i] ?? 0) * 255);
        data[o] = imageTone(byte(0), byte(1), byte(2), x, y, last, p.gain);
        data[o + 1] = 0;
        data[o + 2] = 0;
        data[o + 3] = 1;
      }
    }
  },
};
