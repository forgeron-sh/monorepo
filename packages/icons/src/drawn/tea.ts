import type { PixelIcon } from "../types";

// Cup of tea: a cup and handle, the tea bag's string and tag in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tea",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......oo",
    "......oo",
    ".....o",
    ".#######",
    ".#.....###",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....###",
    "..#...#",
    "...###",
  ],
};

export default icon;
