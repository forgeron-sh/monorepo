import type { PixelIcon } from "../types";

// Bengali script: the letter o.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "alphabet-bangla",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "........#",
    "..###...#",
    ".#...#..#",
    ".....#..#",
    "...######",
    "..#..#..#",
    ".#...#..#",
    "..###...#",
    "........#",
  ],
};

export default icon;
