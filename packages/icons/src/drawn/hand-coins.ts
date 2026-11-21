import type { PixelIcon } from "../types";

// Hand holding coins: the offering hand of the set under a stack of coins in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-coins",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".......ooo",
    "......o...o",
    ".......ooo",
    "......o...o",
    "....#..ooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
