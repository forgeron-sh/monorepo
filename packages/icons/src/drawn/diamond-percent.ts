import type { PixelIcon } from "../types";

// The diamond of `diamond-plus` with a percent sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "diamond-percent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#oo#",
    "...#oooo#",
    "..########",
    ".#........#",
    ".#",
    "..#....o...o",
    "...#......o",
    "....#....o",
    ".....##.o",
    ".......o...o",
  ],
};

export default icon;
