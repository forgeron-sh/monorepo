import type { PixelIcon } from "../types";

// Swipe down: the pointing hand of the set, cut at the wrist, under a long arrow down to its fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-06",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o",
    "....o",
    "...ooo",
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
