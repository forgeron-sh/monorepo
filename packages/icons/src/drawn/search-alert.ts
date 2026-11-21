import type { PixelIcon } from "../types";

// Search alert: the lens of `search-add` with an exclamation mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "search-alert",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...###",
    ".##...##",
    ".#..o..#",
    "#...o...#",
    "#...o...#",
    "#.......#",
    ".#..o..#",
    ".##...##",
    "...###.##",
    "........##",
    ".........##",
  ],
};

export default icon;
