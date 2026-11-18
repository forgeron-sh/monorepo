import type { PixelIcon } from "../types";

// Pyramid seen on a corner: a triangle split by its front edge into two faces.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pyramid",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#.##",
    "....#.##",
    "...#..#.#",
    "...#..#.#",
    "..#...#..#",
    "..#...#..#",
    ".#....#...#",
    ".#....#...#",
    "############",
  ],
};

export default icon;
