import type { PixelIcon } from "../types";

// Whole standing person, head to feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-full-view",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    "",
    "...######",
    "..#......#",
    "..#......#",
    "..###..###",
    "....#..#",
    "....#..#",
    "....####",
  ],
};

export default icon;
