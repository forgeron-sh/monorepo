import type { PixelIcon } from "../types";

// A leg: thigh, knee and shin down to a foot pointing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "body-part-leg",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...####",
    "...#..#",
    "...#..#",
    "...#..#",
    "...#...#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..####",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
