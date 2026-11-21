import type { PixelIcon } from "../types";

// Diagonal: one line with an arrowhead at each end, lower left to upper right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-diagonal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".........##",
    "........#.#",
    ".......#..#",
    "......#",
    ".....#",
    ".#..#",
    ".#.#",
    ".##",
    ".####",
  ],
};

export default icon;
