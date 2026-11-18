import type { PixelIcon } from "../types";

// Swipe left: `swipe-right-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-left-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o",
    "...oooooooo",
    "...o",
    ".......#",
    ".......#",
    ".#.#.#.#..#",
    ".#######.#",
    ".########",
    ".#######",
    "..#####",
    "",
    "..#####",
  ],
};

export default icon;
