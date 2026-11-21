import type { PixelIcon } from "../types";

// Clear search: `search-add` with a small cross.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-remove",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#.....#",
    "#..o.o..#",
    "#...o...#",
    "#..o.o..#",
    ".#.....#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
