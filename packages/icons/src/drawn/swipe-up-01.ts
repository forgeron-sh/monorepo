import type { PixelIcon } from "../types";

// A pointing hand with an arrow up: swipe up. Hand of `cursor-pointer-01`, shortened.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-up-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..........o",
    ".........ooo",
    "..........o",
    "....##....o",
    "...#..#...o",
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
