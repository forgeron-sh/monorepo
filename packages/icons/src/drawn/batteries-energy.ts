import type { PixelIcon } from "../types";

// Two upright batteries side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "batteries-energy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#oo#..#..#",
    ".#oo#..#oo#",
    ".#oo#..#oo#",
    ".#oo#..#oo#",
    ".####..####",
  ],
};

export default icon;
