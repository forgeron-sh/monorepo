import type { PixelIcon } from "../types";

// Pencil standing up: the eraser in the secondary tone, a band, a slim body tapering to a solid point.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pencil",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "....oooo",
    "....####",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    ".....##",
    ".....##",
  ],
};

export default icon;
