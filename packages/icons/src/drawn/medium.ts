import type { PixelIcon } from "../types";

// The Medium mark in pixels: a disc, a narrower ellipse and a thin bar, side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "medium",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####..##",
    "######.##.#",
    "######.##.#",
    "######.##.#",
    "######.##.#",
    ".####..##",
  ],
};

export default icon;
