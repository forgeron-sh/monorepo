import type { PixelIcon } from "../types";

// Pathfinder exclude: two overlapping squares, every edge kept so the overlap reads as a hole.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-exclude",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.....#",
    ".#.....#",
    ".#..#######",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#######..#",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
