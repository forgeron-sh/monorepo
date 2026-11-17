import type { PixelIcon } from "../types";

// The clubs card suit: three lobes on the stem of `spade`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clubs-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    ".###....###",
    "#..........#",
    "#..........#",
    "#..........#",
    ".####..####",
    ".....##",
    "....####",
  ],
};

export default icon;
