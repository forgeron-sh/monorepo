import type { PixelIcon } from "../types";

// Ice cream: a round scoop on a cone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ice-cream-cone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    ".##########",
    "..#......#",
    "...#....#",
    "...#....#",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
