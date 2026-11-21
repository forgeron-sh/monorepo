import type { PixelIcon } from "../types";

// The digit 5 in a ring: the ring of `circle`, the digit in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "five-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..oooo..#",
    "#...o......#",
    "#...ooo....#",
    "#......o...#",
    "#...o..o...#",
    ".#...oo...#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
