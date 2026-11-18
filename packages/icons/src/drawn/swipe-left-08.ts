import type { PixelIcon } from "../types";

// Swipe left: `swipe-right-08` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-left-08",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o",
    "...ooooooooo",
    "...o",
    ".o",
    ".ooooo",
    ".o.....#",
    ".......#",
    ".#.#.#.#..#",
    ".#######.#",
    ".########",
    ".#######",
    "..#####",
  ],
};

export default icon;
