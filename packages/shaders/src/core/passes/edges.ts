import type { PassMeta } from "../contract";

/**
 * Edges: the Sobel gradient of the value (`r`) over the 3×3 cells around each cell, its length
 * times `scale`, capped at 1, as the new value (dither it next). A neighbourhood pass: on the GPU
 * it starts a stage that reads the previous one; the frame's edges are clamped on both sides.
 * Float: agrees with the CPU but for values on a threshold of the pass after it.
 */

export interface EdgesParams {
  /** Gain on the gradient's length. */
  scale: number;
}

export const edgesMeta: PassMeta = {
  type: "edges",
  kind: "neighbourhood",
  usesCell: true,
  description: "Sobel edges of the value: the gradient's length as the value.",
  params: {
    scale: { type: "number", default: 1, min: 0, description: "Gain on the gradient." },
  },
};
