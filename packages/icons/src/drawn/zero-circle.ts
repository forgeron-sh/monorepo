import type { PixelIcon } from "../types";

// The digit 0 in a ring: the ring of `circle`, the digit in the secondary tone, as in `one-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zero-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#...oo...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...o..o...#",
    "#...o..o...#",
    ".#...oo...#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
