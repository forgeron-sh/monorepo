import type { PixelIcon } from "../types";

// Scaling: a small square in the corner of a large one, an arrow growing it to the far corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scaling",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####.oooo",
    ".#.......oo",
    ".#......o.o",
    ".#.....o",
    ".#####o...#",
    ".#...#....#",
    ".#...#....#",
    ".#...#....#",
    ".#...#....#",
    ".##########",
  ],
};

export default icon;
