import type { PixelIcon } from "../types";

// Swipe right with the left hand: `swipe-right-01` with the pointing hand mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-right-06",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    ".ooooooooo",
    ".........o",
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
