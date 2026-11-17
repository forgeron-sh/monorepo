import type { PixelIcon } from "../types";

// Two coins, the front one with a bitcoin B in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-bitcoin",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".#",
    "#...######",
    "#..#......#",
    "#.#...o....#",
    "#.#..ooo...#",
    "#.#..o..o..#",
    "#.#..ooo...#",
    "..#..o..o..#",
    "..#..ooo...#",
    "...#......#",
    "....######",
  ],
};

export default icon;
