import type { PixelIcon } from "../types";

// A smart watch: square face with a screen and a crown, straps above and below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "smart-watch-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "....####",
    "...######",
    "..#......#",
    "..#......#",
    "..#.oooo.##",
    "..#......##",
    "..#.oo...#",
    "..#......#",
    "...######",
    "....####",
    "....####",
  ],
};

export default icon;
