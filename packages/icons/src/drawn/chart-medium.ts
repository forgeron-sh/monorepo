import type { PixelIcon } from "../types";

// Chart medium: axes and an S-curve settling from high to low, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-medium",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#..oo",
    ".#....o",
    ".#.....o",
    ".#.....o",
    ".#.....o",
    ".#......o",
    ".#.......oo",
    ".#",
    ".##########",
  ],
};

export default icon;
