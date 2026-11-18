import type { PixelIcon } from "../types";

// File hierarchy: a file at the root, a bus and two child files, laid out like `hierarchy`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-files",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    "....#.##",
    "....#..#",
    "....####",
    ".....##",
    "..########",
    "..##....##",
    ".###...###",
    ".#.##..#.##",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
