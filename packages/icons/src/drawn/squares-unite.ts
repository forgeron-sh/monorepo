import type { PixelIcon } from "../types";

// Two overlapping squares merged into one outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "squares-unite",
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
