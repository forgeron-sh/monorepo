import type { PixelIcon } from "../types";

// Hand holding a box: the offering hand of the set under a parcel in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hold-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "......ooooo",
    "......o.o.o",
    "......o...o",
    "......o...o",
    "....#.ooooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
