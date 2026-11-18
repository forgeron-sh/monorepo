import type { PixelIcon } from "../types";

// Ice lolly: a rounded bar on a stick in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "popsicle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
