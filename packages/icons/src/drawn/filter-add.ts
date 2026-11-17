import type { PixelIcon } from "../types";

// Add a filter: `filter` with a small plus in the secondary tone at the lower right, clear of the stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter-add",
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
    "....#..#..o",
    "....#..#.ooo",
    "....####..o",
  ],
};

export default icon;
