import type { PixelIcon } from "../types";

// The tree of hierarchy-circle-01 with the root circle in the secondary tone instead of the children.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-circle-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....o..o",
    "....o..o",
    ".....oo",
    ".....##",
    "..########",
    "..##....##",
    "..##....##",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##....##",
  ],
};

export default icon;
