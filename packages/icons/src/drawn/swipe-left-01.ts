import type { PixelIcon } from "../types";

// A pointing hand with an arrow to the left: swipe left. Hand of `cursor-pointer-01`, shortened.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-left-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..o",
    ".oooooooo",
    "..o",
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
