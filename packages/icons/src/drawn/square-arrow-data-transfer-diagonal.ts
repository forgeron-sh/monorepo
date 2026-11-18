import type { PixelIcon } from "../types";

// Square with two opposite diagonal arrows inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "square-arrow-data-transfer-diagonal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....oo..#",
    ".#....oo..#",
    ".#...o....#",
    ".#..o..o..#",
    ".#.o..o...#",
    ".#...oo...#",
    ".#...oo...#",
    "..########",
  ],
};

export default icon;
