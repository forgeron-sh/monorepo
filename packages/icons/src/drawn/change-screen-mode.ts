import type { PixelIcon } from "../types";

// Change screen mode: two overlapping screens, the front one hiding the back one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "change-screen-mode",
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
    ".#.....#..#",
    ".#.....#..#",
    ".#.....####",
    ".#.....#",
    ".#.....#",
    ".#######",
  ],
};

export default icon;
