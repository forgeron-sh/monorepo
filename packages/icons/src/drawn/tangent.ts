import type { PixelIcon } from "../types";

// Tangent: a ring and a straight line in the secondary tone touching it at one point.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tangent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    "......o",
    ".......o",
    "...####.o",
    "..#....#.o",
    ".#......#.o",
    ".#......#",
    ".#......#",
    ".#......#",
    "..#....#",
    "...####",
  ],
};

export default icon;
