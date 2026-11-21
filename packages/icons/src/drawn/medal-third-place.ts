import type { PixelIcon } from "../types";

// Third-place medal: two straps over a large disc with a 3 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medal-third-place",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..##....##",
    "...#....#",
    "....#..#",
    "...######",
    "..#......#",
    ".#..ooo...#",
    ".#.....o..#",
    ".#...oo...#",
    ".#.....o..#",
    ".#..ooo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
