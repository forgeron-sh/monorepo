import type { PixelIcon } from "../types";

// Land plot: a parcel of ground with a flag on a pole, the flag in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "land-plot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#ooo",
    ".....#oo",
    ".....#o",
    ".....#",
    ".....#",
    "...########",
    "..#......#",
    ".#......#",
    "########",
  ],
};

export default icon;
