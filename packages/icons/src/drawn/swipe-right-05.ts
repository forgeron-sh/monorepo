import type { PixelIcon } from "../types";

// Two-finger swipe right: the pointing hand of the set with two fingers raised, under an arrow to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-right-05",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    ".ooooooooo",
    ".........o",
    "....#.#",
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
