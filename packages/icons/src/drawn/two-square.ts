import type { PixelIcon } from "../types";

// The digit two in a square. Square and digit style of `three-square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "two-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..ooo...#",
    ".#.o...o..#",
    ".#....o...#",
    ".#...o....#",
    ".#.ooooo..#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
