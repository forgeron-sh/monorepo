import type { PixelIcon } from "../types";

// Exclamation mark in a diamond that uses the full grid, the mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alert-diamond",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..#..oo..#",
    ".#...oo...#",
    "#....oo....#",
    "#..........#",
    ".#........#",
    "..#..oo..#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
