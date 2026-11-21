import type { PixelIcon } from "../types";

// Table of three columns with a plus over the new middle column.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-column",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    "....ooo",
    ".....o",
    "",
    "###########",
    "#..#ooo#..#",
    "#..#ooo#..#",
    "#..#ooo#..#",
    "#..#ooo#..#",
    "#..#ooo#..#",
    "###########",
  ],
};

export default icon;
