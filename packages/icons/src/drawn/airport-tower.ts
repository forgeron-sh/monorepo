import type { PixelIcon } from "../types";

// An airport control tower with a glazed cab.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "airport-tower",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..########",
    ".#..#..#..#",
    "..########",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
    "...#....#",
    "..########",
  ],
};

export default icon;
