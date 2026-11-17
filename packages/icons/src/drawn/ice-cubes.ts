import type { PixelIcon } from "../types";

// Ice cubes: two overlapping cubes, a glint in the secondary tone on the front one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ice-cubes",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    "....#.....#",
    ".#######..#",
    ".#.oo..#..#",
    ".#.o...#..#",
    ".#.....####",
    ".#.....#",
    ".#.....#",
    ".#######",
  ],
};

export default icon;
