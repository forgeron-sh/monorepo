import type { PixelIcon } from "../types";

// An arrow pointing up right in a ring, `circle-arrow-down-left` turned a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-up-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..ooooo.#",
    ".#.....oo.#",
    ".#....o.o.#",
    ".#...o..o.#",
    ".#..o...o.#",
    ".#.o......#",
    "..#......#",
    "...######",
  ],
};

export default icon;
