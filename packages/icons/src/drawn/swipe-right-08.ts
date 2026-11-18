import type { PixelIcon } from "../types";

// Fast swipe right: the pointing hand of the set, cut at the wrist, under two staggered arrows to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-right-08",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........o",
    "ooooooooo",
    "........o",
    "..........o",
    "......ooooo",
    "....#.....o",
    "....#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
  ],
};

export default icon;
