import type { PixelIcon } from "../types";

// Wrench at 45°: an open jaw on the upper right, a two-pixel handle down to the lower left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wrench-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#..#",
    ".....##..##",
    ".....######",
    ".....#####",
    "....###",
    "...###",
    "..###",
    ".###",
    ".##",
  ],
};

export default icon;
