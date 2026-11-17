import type { PixelIcon } from "../types";

// The digit seven in the secondary tone in the frame of `nine-square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "seven-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..oooo..#",
    ".#.....o..#",
    ".#....o...#",
    ".#....o...#",
    ".#...o....#",
    ".#...o....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
