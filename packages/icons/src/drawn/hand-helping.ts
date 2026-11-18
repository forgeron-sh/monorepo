import type { PixelIcon } from "../types";

// Helping hand: the offering hand of the set, empty, raised to the middle of the grid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-helping",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "",
    "....#",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
