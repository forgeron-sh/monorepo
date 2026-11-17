import type { PixelIcon } from "../types";

// AI elements: a triangle and a square from `shapes`, the AI sparkle badge in place of the circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-elements",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..########",
    "",
    "",
    ".#####",
    ".#...#...o",
    ".#...#..ooo",
    ".#...#.ooooo",
    ".#####..ooo",
    ".........o",
  ],
};

export default icon;
