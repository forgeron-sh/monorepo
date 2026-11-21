import type { PixelIcon } from "../types";

// Gem of `diamond` with a minus badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "diamond-minus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#oo#",
    "...#oooo#",
    "..########",
    ".#........#",
    ".#........#",
    "..#",
    "...#..ooooo",
    "....#",
    ".....##",
  ],
};

export default icon;
