import type { SourceMeta } from "../contract";

/** One value everywhere: a level for a dither mask (the captions' corruption, the burn's fringe). */

export interface ConstantParams {
  value: number;
}

export const constantMeta: SourceMeta = {
  type: "constant",
  description: "One value in every cell.",
  params: { value: { type: "number", default: 0.5, description: "The value." } },
};
