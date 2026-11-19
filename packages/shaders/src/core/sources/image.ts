import type { SourceDef } from "../contract";

/** Pixels of a picture already sized to the frame, row by row (an `ImageData`). */
export interface ImagePixels {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

/**
 * A picture, one pixel per cell, read from `data.image` (an `ImagePixels`): colours as bytes over
 * 255. On the GPU, a texture made by the pipeline from the same pixels.
 */
export const imageSource: SourceDef<Record<string, never>> = {
  type: "image",
  description: "A picture, one pixel per cell.",
  params: {},
  glsl: () => ({
    decl: ["uniform highp sampler2D uImage;"],
    body: "return texelFetch(uImage,ivec2(int(cell.x),int(uCells.y-1.-cell.y)),0);",
    bind(set) {
      set.texture("uImage", "image");
    },
  }),
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
