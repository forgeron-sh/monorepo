import type { PixelIcon } from "../types";

// Scatter of three points along a trend line in the secondary tone, on two axes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "covariate",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#...##...o",
    ".#...##..o",
    ".#.##...o",
    ".#.##..o",
    ".#....o",
    ".#...o",
    ".#..o..##",
    ".#.o...##",
    ".#o",
    ".##########",
  ],
};

export default icon;
