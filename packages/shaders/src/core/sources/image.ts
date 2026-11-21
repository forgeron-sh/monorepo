import type { SourceMeta } from "../contract";

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
export const imageMeta: SourceMeta = {
  type: "image",
  description: "A picture, one pixel per cell.",
  params: {},
};
