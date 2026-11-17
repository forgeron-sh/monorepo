import type { PixelIcon } from "../types";

// Pathfinder minus front: the back square with the front one cut away, the front shown dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-minus-front",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.....#",
    ".#.....#",
    ".#..####o.o",
    ".#..#",
    ".#..#.....o",
    ".####",
    "....o.....o",
    "",
    "....o.o.o.o",
  ],
};

export default icon;
