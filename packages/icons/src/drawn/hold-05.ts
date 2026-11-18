import type { PixelIcon } from "../types";

// Hand holding an idea: the offering hand of the set under a light bulb in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hold-05",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......ooo",
    "......o...o",
    "......o...o",
    ".......o.o",
    ".......ooo",
    ".......ooo",
    "....#",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
