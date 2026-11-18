import type { PixelIcon } from "../types";

// Give blood: the offering hand of the set (`hold-01`) under a blood drop in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "give-blood",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........o",
    ".......ooo",
    "......ooooo",
    "......ooooo",
    "......ooooo",
    ".......ooo",
    "....#",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
