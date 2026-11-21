import type { PixelIcon } from "../types";

// Two stacked coins (the coins-pound base) with a euro sign on the front coin in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-euro",
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
    "..#.oooo...#",
    "..#...ooo..#",
    "...#......#",
    "....######",
  ],
};

export default icon;
