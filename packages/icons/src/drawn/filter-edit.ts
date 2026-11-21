import type { PixelIcon } from "../types";

// A funnel and a pencil badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-edit",
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
    "....#..#...o",
    "....#..#..oo",
    "....#..#.oo",
    "....####.o",
  ],
};

export default icon;
