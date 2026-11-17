import type { PixelIcon } from "../types";

// Registered mark: the copyright ring with an R in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "registered",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..ooo...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...ooo....#",
    "#...o..o...#",
    ".#..o..o..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
