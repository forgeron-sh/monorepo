import type { PixelIcon } from "../types";

// Swipe right along a curve: the pointing hand of the set under an arc that comes down on the right into an arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-right-09",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...ooooo",
    "..o.....o.o",
    ".o.......oo",
    "....#...ooo",
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
