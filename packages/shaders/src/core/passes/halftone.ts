import type { PassMeta } from "../contract";

/**
 * Halftone: dots on a grid turned by `angle`, `size` cells apart; a cell is in a dot when its
 * distance to the dot's centre is under `√(v / 2)` pitches, so a value of 1 fills the cell of the
 * grid and 0 leaves it empty. The value is the cell's own (an amplitude-modulated screen sampled
 * per cell). Cell coordinates from the bottom, as the GPU's. Float: the rotation's cosine and
 * sine are written once as literals, and both sides agree but for cells on a dot's edge.
 */

export interface HalftoneParams {
  /** Pitch of the dot grid, in cells. */
  size: number;
  /** Angle of the grid, in degrees. */
  angle: number;
  /** Tone index of a dot (the background is 0). */
  tone: number;
}

export const halftoneMeta: PassMeta = {
  type: "halftone",
  kind: "cell",
  usesCell: true,
  description: "Dots on a turned grid, as large as the value: tone indices.",
  params: {
    size: { type: "number", default: 6, min: 2, max: 64, description: "Pitch, in cells." },
    angle: { type: "number", default: 45, min: -180, max: 180, description: "Angle, in degrees." },
    tone: { type: "number", default: 1, min: 1, integer: true, description: "Tone of a dot." },
  },
};

/** `cos`, `sin` and `1 / size` as they are written in the GLSL, read back by the CPU. */
export const halftoneConstants = (p: HalftoneParams) => {
  const a = (p.angle * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a), 1 / p.size].map((n) => Number(n.toPrecision(9))) as [
    number,
    number,
    number,
  ];
};
