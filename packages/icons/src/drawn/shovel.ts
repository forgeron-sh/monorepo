import type { PixelIcon } from "../types";

// Shovel: a D grip, a shaft and a pointed blade.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shovel",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....####",
    ".....##",
    ".....##",
    "...######",
    "...#....#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
