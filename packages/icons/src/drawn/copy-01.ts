import type { PixelIcon } from "../types";

// Two sheets: the front one over the lower left of the back one, two-pixel offsets.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "copy-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    "....#.....#",
    ".#######..#",
    ".#.....#..#",
    ".#.....#..#",
    ".#.....####",
    ".#.....#",
    ".#.....#",
    ".#######",
  ],
};

export default icon;
