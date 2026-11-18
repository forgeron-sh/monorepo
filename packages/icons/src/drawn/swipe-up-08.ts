import type { PixelIcon } from "../types";

// Swipe up: the pointing hand of the set with the arrow up on the thumb side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-up-08",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o",
    "ooo",
    ".o",
    ".o..#",
    "....#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
