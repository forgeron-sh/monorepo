import type { PixelIcon } from "../types";

// Trapezoid outline standing up, wide side to the left, 2:1 slopes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "trapezoid-line-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###",
    "...#..##",
    "...#....##",
    "...#.....#",
    "...#.....#",
    "...#.....#",
    "...#.....#",
    "...#....##",
    "...#..##",
    "...###",
  ],
};

export default icon;
