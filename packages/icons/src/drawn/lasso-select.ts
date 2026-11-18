import type { PixelIcon } from "../types";

// Lasso select: a dashed selection loop and a pointer in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lasso-select",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    ".#.......#",
    "#.........#",
    ".#.......#",
    "...##..##",
    "",
    "......o",
    "......oo",
    "......ooo",
    "......oooo",
    "......ooooo",
    "......ooo",
  ],
};

export default icon;
