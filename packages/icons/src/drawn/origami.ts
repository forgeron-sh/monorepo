import type { PixelIcon } from "../types";

// Origami crane: a raised folded wing, the neck and the tail as two points, solid shapes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "origami",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    ".....##",
    "#...###....#",
    ".#.####...#",
    "..#####..##",
    "..#########",
    "...#######",
    "....#####",
  ],
};

export default icon;
