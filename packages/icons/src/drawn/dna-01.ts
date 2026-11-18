import type { PixelIcon } from "../types";

// DNA lying down: `dna` turned a quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dna-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....#.....#",
    "#...#o#...#",
    "o#.#.o.#.#o",
    "o.#..o..#.o",
    "o.#..o..#.o",
    "o#.#.o.#.#o",
    "#...#o#...#",
    ".....#.....#",
  ],
};

export default icon;
