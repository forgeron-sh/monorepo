import type { PixelIcon } from "../types";

// Two stacked coins (the coins-euro base) with a dollar sign on the front coin in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-dollar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".#",
    "#...######",
    "#..#......#",
    "#.#....o...#",
    "#.#...oooo.#",
    "#.#..oo....#",
    "#.#...ooo..#",
    "..#.....oo.#",
    "..#..oooo..#",
    "...#...o..#",
    "....######",
  ],
};

export default icon;
