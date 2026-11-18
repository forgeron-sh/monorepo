import type { PixelIcon } from "../types";

// Chinese script: the character wen, writing.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "alphabet-chinese",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "",
    ".##########",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
  ],
};

export default icon;
