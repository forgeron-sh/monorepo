import type { PixelIcon } from "../types";

// A coffee bean: an oval split by an S-shaped crease.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bean",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#...#..#",
    "..#...#..#",
    "..#..#...#",
    "..#..#...#",
    "..#...#..#",
    "..#...#..#",
    "...#....#",
    "....####",
  ],
};

export default icon;
