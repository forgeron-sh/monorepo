import type { PixelIcon } from "../types";

// Cashback: the return arrow ring of `cashback-euro` around a yen sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cashback-yen",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..o...o.#",
    "###..o.o..#",
    ".#..ooooo.#",
    "......o...#",
    "....ooooo.#",
    "......o...#",
    ".........#",
    "......###",
  ],
};

export default icon;
