import type { PixelIcon } from "../types";

// Two coins, the front one with a left and a right arrow in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "coins-swap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..######",
    ".#",
    "#...######",
    "#..#......#",
    "#.#..o.....#",
    "#.#.oooooo.#",
    "#.#..o.....#",
    "#.#.....o..#",
    "..#.oooooo.#",
    "..#.....o..#",
    "...#......#",
    "....######",
  ],
};

export default icon;
