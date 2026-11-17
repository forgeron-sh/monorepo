import type { PixelIcon } from "../types";

// Parking sign in the full-grid ring of `circle`: the P of `parking-area-square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "parking-area-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#........#",
    ".#..oooo..#",
    "#...oo.oo..#",
    "#...oo.oo..#",
    "#...oooo...#",
    "#...oo.....#",
    ".#..oo....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
