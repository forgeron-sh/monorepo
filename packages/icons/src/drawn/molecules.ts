import type { PixelIcon } from "../types";

// Molecules: three atoms joined by bonds.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "molecules",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..#..#..#",
    ".#..#..#..#",
    "..##....##",
    "....#..#",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
