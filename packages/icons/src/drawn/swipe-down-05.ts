import type { PixelIcon } from "../types";

// Swipe down with the left hand: `swipe-down-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-05",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o",
    "...o",
    "..ooo",
    "...o...#",
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
