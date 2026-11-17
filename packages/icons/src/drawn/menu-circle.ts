import type { PixelIcon } from "../types";

// Three menu lines in a ring: the ring of `circle`, the lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "menu-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#...oooo...#",
    "#..........#",
    "#...oooo...#",
    "#..........#",
    ".#..oooo..#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
