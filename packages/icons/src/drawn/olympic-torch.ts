import type { PixelIcon } from "../types";

// Torch with a flame in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "olympic-torch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......o",
    ".....oo",
    "....oooo",
    "....oooo",
    "..########",
    "...#....#",
    "....####",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
