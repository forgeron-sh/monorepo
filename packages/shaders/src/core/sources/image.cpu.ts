import type { CpuSource } from "../contract";
import type { ImagePixels } from "./image";

export const imageCpu: CpuSource<Record<string, never>> = {
  type: "image",
  cpu(frame, _p, ctx) {
    const img = ctx.data?.image as ImagePixels | undefined;
    const { width: w, height: h, data } = frame;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        const i = (y * (img?.width ?? 0) + x) * 4;
        const inside = img && x < img.width && y < img.height;
        data[o] = inside ? (img.data[i] ?? 0) / 255 : 0;
        data[o + 1] = inside ? (img.data[i + 1] ?? 0) / 255 : 0;
        data[o + 2] = inside ? (img.data[i + 2] ?? 0) / 255 : 0;
        data[o + 3] = inside ? (img.data[i + 3] ?? 0) / 255 : 0;
      }
    }
  },
};
