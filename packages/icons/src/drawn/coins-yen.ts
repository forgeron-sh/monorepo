import type { PixelIcon } from "../types";

// Two coins, the front one with a yen sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-yen",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".#",
    "#...######",
    "#..#......#",
    "#.#.o...o..#",
    "#.#..o.o...#",
    "#.#.ooooo..#",
    "#.#...o....#",
    "..#.ooooo..#",
    "..#...o....#",
    "...#......#",
    "....######",
  ],
};

export default icon;
