import type { PixelIcon } from "../types";

// Minus in the full-grid ring of `circle`, the bar in the secondary tone (`remove-circle` uses the
// smaller ring of `clock-01`).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minus-sign-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    "#..........#",
    "#..oooooo..#",
    "#..oooooo..#",
    "#..........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
