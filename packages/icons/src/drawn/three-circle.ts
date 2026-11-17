import type { PixelIcon } from "../types";

// The digit 3, in the secondary tone, in a circle; the circle of circle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "three-circle",
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
    "#....oo....#",
    "#......o...#",
    "#...ooo....#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
