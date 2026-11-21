import type { PixelIcon } from "../types";

// Q-Q plot: two axes, the reference diagonal in the secondary tone and points beside it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "qq-plot",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#........o",
    ".#....##.o",
    ".#....##o",
    ".#.....o",
    ".#....o",
    ".#...o##",
    ".#..o.##",
    ".#.o",
    ".##########",
  ],
};

export default icon;
