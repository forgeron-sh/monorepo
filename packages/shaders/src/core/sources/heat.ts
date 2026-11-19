import type { SourceMeta } from "../contract";

export const heatMeta: SourceMeta = {
  type: "heat",
  description: "The dither field's heat, rising from the bottom right (CPU only).",
  params: {},
};

/**
 * The dither field's heat: a slow ember heat rising from the bottom right, stirred by two waves.
 * The texture of the sub-sites' heroes (ui, icons, font). CPU only: the sites ran it on a 2D
 * canvas in float64, and a GLSL port would change their pixels.
 */
export function heatLevel(u: number, v: number, t: number): number {
  // Heat rising from the bottom right, stirred by two slow waves.
  const glow = Math.max(0, 1 - Math.hypot((u - 0.92) * 1.3, (v - 1.05) * 1.6));
  const wave = 0.5 + 0.5 * Math.sin(u * 9 + t * 0.6 + Math.sin(v * 5 - t * 0.4) * 1.6);
  return glow * 0.9 + wave * 0.18 * glow + (1 - v) * 0.04;
}
