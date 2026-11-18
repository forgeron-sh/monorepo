import type { PixelIcon } from "../types";

// Double tap: the pointing hand of the set, cut at the wrist, under two nested arcs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tap-06",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..ooooo",
    ".o.....o",
    "...ooo",
    "..o...o",
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
