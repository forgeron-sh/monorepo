import type { PixelIcon } from "../types";

// Funnel with a cross: `filter` with a small cross in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "funnel-x",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#.o.o",
    "....#..#..o",
    "....####.o.o",
  ],
};

export default icon;
