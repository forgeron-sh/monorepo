import type { PixelIcon } from "../types";

// Wudu: the offering hand of the set under a water drop in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wudu",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......o",
    ".....o.o",
    "....o...o",
    "....o...o",
    ".....ooo",
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
