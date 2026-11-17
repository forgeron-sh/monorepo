import type { PixelIcon } from "../types";

// Pathfinder divide: two overlapping squares split into pieces along every edge, the middle piece in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-divide",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.....#",
    ".#.....#",
    ".#..oooo###",
    ".#..o..o..#",
    ".#..o..o..#",
    ".###oooo..#",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
