import type { PixelIcon } from "../types";

// Alpha in a square: the box of `square` and the letter α in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alpha-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oo..o.#",
    ".#.o..o.o.#",
    ".#.o...o..#",
    ".#.o...o..#",
    ".#.o..o.o.#",
    ".#..oo..o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
