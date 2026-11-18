import type { PixelIcon } from "../types";

// Swipe right: the pointing hand of the set beside an arrow to the right with a dashed trail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-right-07",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    "oo.oo.ooooo",
    "..........o",
    "....#",
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
