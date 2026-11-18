import type { PixelIcon } from "../types";

// Falling chart: `chart-increase` with the line descending to an arrow at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-decrease",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#o...o",
    ".#.o.o.o",
    ".#..o...o",
    ".#.......o.o",
    ".#........oo",
    ".#.........o",
    ".#......oooo",
    ".#",
    ".##########",
  ],
};

export default icon;
