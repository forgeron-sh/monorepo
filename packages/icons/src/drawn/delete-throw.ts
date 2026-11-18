import type { PixelIcon } from "../types";

// Throwing away: a ball in the secondary tone above an open bin.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "delete-throw",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".oo",
    ".oo",
    "......##",
    "...########",
    "",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#....#",
    "....#....#",
    ".....####",
  ],
};

export default icon;
