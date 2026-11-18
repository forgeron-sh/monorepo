import type { PixelIcon } from "../types";

// Pathfinder trim: the front square whole, the back one trimmed where it hides, its hidden part dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-trim",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.....#",
    ".#.....#",
    ".#..#######",
    ".#..#..o..#",
    ".#..#.....#",
    ".####o.o..#",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
