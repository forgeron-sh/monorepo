import type { PixelIcon } from "../types";

// Copyleft: the copyright ring with its C mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "copyleft",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..ooo...#",
    "#......o...#",
    "#......o...#",
    "#......o...#",
    "#......o...#",
    ".#..ooo...#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
