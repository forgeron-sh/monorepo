import type { PixelIcon } from "../types";

// Balloon: an oval with a knot and a short string.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "balloon",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    ".....#",
    "......#",
  ],
};

export default icon;
