import type { PixelIcon } from "../types";

// Rub el Hizb: the eight-pointed star of two overlapping squares, one turned at 45°.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "rub-el-hizb",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    ".###....###",
    ".#........#",
    ".#........#",
    "#..........#",
    "#..........#",
    ".#........#",
    ".#........#",
    ".###....###",
    "....#..#",
    ".....##",
  ],
};

export default icon;
