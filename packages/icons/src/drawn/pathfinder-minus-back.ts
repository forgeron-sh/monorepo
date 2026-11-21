import type { PixelIcon } from "../types";

// Pathfinder minus back: the front square with the back one cut away, the back shown dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pathfinder-minus-back",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o.o.o.o",
    "",
    ".o.....o",
    ".......####",
    ".o.....#..#",
    ".......#..#",
    ".o.o####..#",
    "....#.....#",
    "....#.....#",
    "....#######",
  ],
};

export default icon;
