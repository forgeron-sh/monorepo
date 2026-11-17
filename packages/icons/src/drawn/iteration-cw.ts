import type { PixelIcon } from "../types";

// Clockwise iteration: a loop running over the top and back along the bottom to an arrow pointing left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "iteration-cw",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..........#",
    "..........#",
    "..#.......#",
    ".#.......#",
    "#########",
    ".#",
    "..#",
  ],
};

export default icon;
