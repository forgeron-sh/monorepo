import type { PixelIcon } from "../types";

// Two-finger tap: the pointing hand of the set with two fingers raised under a wide arc.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tap-05",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...ooooo",
    "..o.....o",
    "",
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
