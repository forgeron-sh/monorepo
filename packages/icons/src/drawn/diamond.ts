import type { PixelIcon } from "../types";

// Diamond: a rhombus cut by a girdle line, the crown above it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "diamond",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#oo#",
    "...#oooo#",
    "..########",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
