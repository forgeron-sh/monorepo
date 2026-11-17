import type { PixelIcon } from "../types";

// Pathfinder unite: two overlapping squares merged into one outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-unite",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.....#",
    ".#.....#",
    ".#.....####",
    ".#........#",
    ".#........#",
    ".####.....#",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
