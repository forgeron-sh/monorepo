import type { PixelIcon } from "../types";

// A blood drop with the letter A.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "blood-type",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    "..#..oo..#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".#..o..o..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
