import type { PixelIcon } from "../types";

// Engine: a block with a filler cap on top, an intake on the left and an outlet on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "engine",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#####",
    ".....#",
    "..#######",
    "..#......##",
    "###.......#",
    "#.#.......#",
    "###.......#",
    "..#......##",
    "..########",
  ],
};

export default icon;
