import type { PixelIcon } from "../types";

// Plug pointing down into a socket plate.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "plug-socket",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    ".....##",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..########",
    "....#..#",
    "....#..#",
    ".oooooooooo",
  ],
};

export default icon;
