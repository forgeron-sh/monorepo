import type { PixelIcon } from "../types";

// Lifebuoy: a ring with four bands in the secondary tone at top, bottom, left and right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lifebuoy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##oooo##",
    ".#..oooo..#",
    ".#..####..#",
    "#oo#....#oo#",
    "#oo#....#oo#",
    "#oo#....#oo#",
    "#oo#....#oo#",
    ".#..####..#",
    ".#..oooo..#",
    "..##oooo##",
    "....####",
  ],
};

export default icon;
