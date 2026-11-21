import type { PixelIcon } from "../types";

// A circle holding a division sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "divide-sign-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#...oo...#",
    ".#...oo...#",
    "#..........#",
    "#..oooooo..#",
    "#..oooooo..#",
    "#..........#",
    ".#...oo...#",
    ".#...oo...#",
    "..##....##",
    "....####",
  ],
};

export default icon;
