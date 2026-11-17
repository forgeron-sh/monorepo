import type { PixelIcon } from "../types";

// The digit 6 in a square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "six-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..o.....#",
    ".#..ooo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
