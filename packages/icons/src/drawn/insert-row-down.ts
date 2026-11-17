import type { PixelIcon } from "../types";

// Table of two rows with a plus below it: insert a row after.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-row-down",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#########",
    ".#.......#",
    ".#.......#",
    ".#########",
    ".#.......#",
    ".#.......#",
    ".#########",
    "",
    ".....o",
    "....ooo",
    ".....o",
  ],
};

export default icon;
