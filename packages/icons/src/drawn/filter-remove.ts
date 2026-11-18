import type { PixelIcon } from "../types";

// Remove a filter: `filter-add` with a minus.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-remove",
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
    "....#..#",
    "....#..#.ooo",
    "....####",
  ],
};

export default icon;
