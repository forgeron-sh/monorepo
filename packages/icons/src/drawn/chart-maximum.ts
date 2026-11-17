import type { PixelIcon } from "../types";

// Chart maximum: axes and a curve rising to a peak and falling, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-maximum",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.....oo",
    ".#....o..o",
    ".#...o....o",
    ".#...o....o",
    ".#..o......o",
    ".#..o......o",
    ".#..o......o",
    ".#",
    ".##########",
  ],
};

export default icon;
