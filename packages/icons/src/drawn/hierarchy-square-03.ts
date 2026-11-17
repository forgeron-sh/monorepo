import type { PixelIcon } from "../types";

// The tree of hierarchy-square-01 with the root square in the secondary tone instead of the children.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-square-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "....o..o",
    "....o..o",
    "....oooo",
    ".....##",
    "..########",
    "..##....##",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
