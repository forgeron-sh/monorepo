import type { PixelIcon } from "../types";

// Save energy: the offering hand of the set (`hold-01`) under a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "save-energy-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........oo",
    ".......oo",
    "......ooooo",
    "........oo",
    ".......oo",
    "......oo",
    "....#",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
