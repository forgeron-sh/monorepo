import type { GlslPass, PassMeta } from "../contract";

/**
 * Floyd–Steinberg error diffusion: the value of each cell, row by row, becomes the nearest of
 * `levels` tones, and its error goes to the cells not yet visited (7/16 right, 3/16 below left,
 * 5/16 below, 1/16 below right). Serial by nature: it runs on the CPU only. A GPU version would
 * be an approximation (blue noise is the GPU's error-diffusion look) and is not offered: a chain
 * with this pass runs on the CPU (`runCpu`, a 2D canvas, a static output).
 */

export interface FloydSteinbergParams {
  /** How many tones, from 0 (the background) to `levels - 1`: the value 0..1 spread over them. */
  levels: number;
  /** Alternate the direction of each row (less directional worms). */
  serpentine: boolean;
}

export const floydSteinbergMeta: PassMeta = {
  type: "floyd-steinberg",
  kind: "neighbourhood",
  usesCell: true,
  description: "Floyd–Steinberg error diffusion of the value into tone indices (CPU only).",
  params: {
    levels: {
      type: "number",
      default: 2,
      min: 2,
      max: 16,
      integer: true,
      description: "Tones from 0 to levels − 1.",
    },
    serpentine: {
      type: "boolean",
      default: true,
      description: "Alternate the direction of each row.",
    },
  },
};

/** No GLSL: error diffusion is serial (`compileStages` says so). */
export const floydSteinbergGlsl: GlslPass<FloydSteinbergParams> = {
  type: "floyd-steinberg",
  kind: "neighbourhood",
  usesCell: true,
  glsl: null,
};
