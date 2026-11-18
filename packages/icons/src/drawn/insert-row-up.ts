import type { PixelIcon } from "../types";

// Table of two rows with a plus above it: insert a row before.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-row-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    "....ooo",
    ".....o",
    "",
    ".#########",
    ".#.......#",
    ".#.......#",
    ".#########",
    ".#.......#",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
