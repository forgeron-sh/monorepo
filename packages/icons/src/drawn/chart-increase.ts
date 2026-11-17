import type { PixelIcon } from "../types";

// Rising chart: two axes and a line climbing in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-increase",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#......oooo",
    ".#.........o",
    ".#........oo",
    ".#.......o.o",
    ".#..o...o",
    ".#.o.o.o",
    ".#o...o",
    ".#",
    ".##########",
  ],
};

export default icon;
