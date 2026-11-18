import type { PixelIcon } from "../types";

// A flexed arm: fist up, forearm down to the elbow, the biceps bulging in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "biceps-flexed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    ".#....#",
    ".#....#",
    "..#..#",
    "..#..#.ooo",
    "..#..#o...o",
    "..#........#",
    "..#........#",
    "...#.......#",
    "....########",
  ],
};

export default icon;
