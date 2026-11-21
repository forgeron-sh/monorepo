import type { PixelIcon } from "../types";

// Chart minimum: axes and a curve falling to a low point and rising, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-minimum",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#..o......o",
    ".#..o......o",
    ".#..o......o",
    ".#...o....o",
    ".#...o....o",
    ".#....o..o",
    ".#.....oo",
    ".#",
    ".##########",
  ],
};

export default icon;
