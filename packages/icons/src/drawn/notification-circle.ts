import type { PixelIcon } from "../types";

// Bell in the full-grid ring of `circle`, the bell in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notification-circle",
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
    "#..o....o..#",
    "#..oooooo..#",
    ".#........#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
