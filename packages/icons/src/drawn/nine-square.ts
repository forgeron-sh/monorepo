import type { PixelIcon } from "../types";

// The digit 9 in a square: the frame of `square`, the digit in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "nine-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...ooo..#",
    ".#.....o..#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
