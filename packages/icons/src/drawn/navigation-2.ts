import type { PixelIcon } from "../types";

// Navigation arrowhead pointing up, in outline: `navigation-2-off` without its stroke.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "navigation-2",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".#..####..#",
    ".###....###",
    "##........##",
  ],
};

export default icon;
