import type { PixelIcon } from "../types";

// Swipe down: the pointing hand of the set with the arrow down on the thumb side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-08",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o",
    ".o",
    "ooo",
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
