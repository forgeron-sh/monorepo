import type { PixelIcon } from "../types";

// Column chart increasing: an axis with three columns getting taller, the columns in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-column-increasing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.......o",
    ".#.......o",
    ".#....o..o",
    ".#....o..o",
    ".#....o..o",
    ".#.o..o..o",
    ".#.o..o..o",
    ".#",
    ".##########",
  ],
};

export default icon;
