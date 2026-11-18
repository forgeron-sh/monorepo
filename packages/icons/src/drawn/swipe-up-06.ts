import type { PixelIcon } from "../types";

// Swipe up: the pointing hand of the set, cut at the wrist, under a long arrow up from its fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-up-06",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o",
    "...ooo",
    "....o",
    "....o",
    "",
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
