import type { PixelIcon } from "../types";

// Cashback: the return arrow ring of `cashback-euro` around a dollar sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cashback",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....o...#",
    "###..oooo.#",
    ".#...o....#",
    ".....oooo.#",
    "........o.#",
    ".....oooo.#",
    "......o..#",
    "......###",
  ],
};

export default icon;
