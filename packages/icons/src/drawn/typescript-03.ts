import type { PixelIcon } from "../types";

// A document with a folded corner, its lower right taken by the letters TS in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "typescript-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "######",
    "#....##",
    "#....#.#",
    "#....####",
    "#.......#",
    "#.......#",
    "#...ooo..oo",
    "#....o..o",
    "#....o...o",
    "#....o....o",
    "#....o..oo",
    "####",
  ],
};

export default icon;
