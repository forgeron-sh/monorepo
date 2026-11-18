import type { PixelIcon } from "../types";

// Counter-clockwise iteration: `iteration-cw` mirrored, the arrow pointing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "iteration-ccw",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#",
    ".#.......#",
    "..#.......#",
    "...#########",
    "..........#",
    ".........#",
  ],
};

export default icon;
