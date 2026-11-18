import type { PixelIcon } from "../types";

// Two-finger swipe up: the pointing hand of the set with two fingers raised, beside an arrow up.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-up-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    "........ooo",
    ".........o",
    "....#.#..o",
    "....#.#",
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
