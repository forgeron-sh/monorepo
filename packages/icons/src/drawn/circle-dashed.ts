import type { PixelIcon } from "../types";

// Dashed circle: the full-grid ring broken into eight dashes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..#......#",
    ".#........#",
    "",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "",
    ".#........#",
    "..#......#",
    "....####",
  ],
};

export default icon;
