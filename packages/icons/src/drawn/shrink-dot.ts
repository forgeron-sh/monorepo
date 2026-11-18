import type { PixelIcon } from "../types";

// Shrink: four arrows pointing in to a centre point.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shrink-dot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.#....#.#",
    "..##....##",
    ".###....###",
    "",
    ".....oo",
    ".....oo",
    "",
    ".###....###",
    "..##....##",
    ".#.#....#.#",
  ],
};

export default icon;
