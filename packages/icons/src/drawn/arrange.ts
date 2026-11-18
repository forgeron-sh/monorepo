import type { PixelIcon } from "../types";

// Arrange: a square brought in front of another one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "arrange",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#",
    ".#....#",
    ".#..#######",
    ".#..#.....#",
    ".####.....#",
    "....#.....#",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
