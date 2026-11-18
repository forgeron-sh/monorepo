import type { PixelIcon } from "../types";

// Ice lolly: a rounded bar on a stick.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ice-cream-02",
  implemented: true,
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
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
