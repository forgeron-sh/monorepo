import type { PixelIcon } from "../types";

// Two coins, the front one with a pound sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-pound",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".#",
    "#...######",
    "#..#......#",
    "#.#...ooo..#",
    "#.#..o.....#",
    "#.#.oooo...#",
    "#.#..o.....#",
    "..#..o.....#",
    "..#.ooooo..#",
    "...#......#",
    "....######",
  ],
};

export default icon;
