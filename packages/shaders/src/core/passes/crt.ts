import type { PassMeta } from "../contract";

/**
 * CRT: the picture on a curved screen, at output resolution (a `present` pass that reads the
 * previous stage, so it starts the last stage). Each output pixel samples the cell under its
 * barrel-distorted position (black outside the tube), adds a bloom (the mean of the 3×3 cells
 * around it), dims the two channels its aperture-mask column does not carry, and darkens towards
 * the corners. On colours: after the palette. Float: agrees with the CPU but for pixels on a
 * cell's edge after the distortion and bytes on a rounding edge (stated tolerance).
 */

export interface CrtParams {
  /** Barrel distortion: 0 is flat. */
  curvature: number;
  /** Dimming of the two other channels in each column of the aperture mask, 0 to 1. */
  mask: number;
  /** Share of the neighbours' mean added to each pixel. */
  bloom: number;
  /** Darkening towards the corners, 0 to 1. */
  vignette: number;
}

export const crtMeta: PassMeta = {
  type: "crt",
  kind: "present",
  cut: true,
  usesCell: true,
  description: "A curved tube: barrel distortion, aperture mask, bloom and vignette.",
  params: {
    curvature: { type: "number", default: 0.12, min: 0, max: 0.5, description: "Barrel." },
    mask: { type: "number", default: 0.3, min: 0, max: 1, description: "Aperture mask." },
    bloom: { type: "number", default: 0.35, min: 0, max: 2, description: "Bloom." },
    vignette: { type: "number", default: 0.35, min: 0, max: 1, description: "Vignette." },
  },
};
