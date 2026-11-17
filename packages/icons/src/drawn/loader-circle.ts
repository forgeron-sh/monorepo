import type { PixelIcon } from "../types";

// Loading spinner: three quarters of a ring, open at the top right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "loader-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....##",
    "..##",
    ".#",
    ".#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
