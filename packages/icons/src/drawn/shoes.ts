import type { PixelIcon } from "../types";

// Sneaker seen from the side on a flat sole.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shoes",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".####",
    ".#..#",
    ".#...##",
    ".#.....##",
    ".#.......##",
    ".#.........#",
    "############",
  ],
};

export default icon;
