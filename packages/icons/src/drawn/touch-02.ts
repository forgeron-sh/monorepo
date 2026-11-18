import type { PixelIcon } from "../types";

// A pointing hand with three short rays above the fingertip: a tap. Hand of `swipe-right-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touch-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o..oo..o",
    "..o....o",
    "",
    "....##",
    "...#..#",
    "...#..###",
    "...#..#..##",
    ".###.....#",
    ".#.......#",
    "..#......#",
    "...#....#",
    "...######",
  ],
};

export default icon;
