import type { PixelIcon } from "../types";

// Fast swipe up: the pointing hand of the set, cut at the wrist, under two arrows up.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-up-07",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o",
    "...ooo..o",
    "....o..ooo",
    "....o...o",
    "........o",
    "....#",
    "....#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
  ],
};

export default icon;
