import type { PixelIcon } from "../types";

// The digit 1 in a square: the frame of `square`, the digit in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "one-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....o...#",
    ".#...oo...#",
    ".#....o...#",
    ".#....o...#",
    ".#....o...#",
    ".#..oooo..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
