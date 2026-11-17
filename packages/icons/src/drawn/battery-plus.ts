import type { PixelIcon } from "../types";

// Battery with a plus inside in the secondary tone, to charge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "battery-plus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#########",
    ".#.......#",
    ".#...oo..#",
    ".#..oooo.##",
    ".#..oooo.##",
    ".#...oo..#",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
