import type { PixelIcon } from "../types";

// Fast swipe down: the pointing hand of the set, cut at the wrist, under two arrows down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-07",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o...o",
    "....o...o",
    "...ooo..o",
    "....o..ooo",
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
