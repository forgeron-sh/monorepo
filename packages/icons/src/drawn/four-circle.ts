import type { PixelIcon } from "../types";

// The digit 4 in a ring: the ring of `circle`, the digit in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "four-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..o..o..#",
    "#...o..o...#",
    "#...oooo...#",
    "#......o...#",
    "#......o...#",
    ".#.....o..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
