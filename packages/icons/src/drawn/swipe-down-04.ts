import type { PixelIcon } from "../types";

// Two-finger swipe down: the pointing hand of the set with two fingers raised, beside an arrow down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    ".........o",
    "........ooo",
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
