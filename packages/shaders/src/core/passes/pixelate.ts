import type { PassDef } from "../contract";

export interface PixelateParams {
  /** Side of one cell in CSS pixels, a whole number (times the device pixel ratio when live). */
  size: number;
}

/**
 * Sets the cell size of the chain (hoisted, as Blueprint's `plan` does): the source is computed
 * once per cell, never resampled. First in a chain, at most once.
 */
export const pixelatePass: PassDef<PixelateParams> = {
  type: "pixelate",
  kind: "layout",
  description: "Cell size: the source is computed once per cell of `size` CSS pixels.",
  params: {
    size: {
      type: "number",
      default: 1,
      min: 1,
      integer: true,
      description: "Side of one cell in CSS pixels.",
    },
  },
  glsl: () => ({ decl: [], body: "" }),
  cpu: () => {},
};
