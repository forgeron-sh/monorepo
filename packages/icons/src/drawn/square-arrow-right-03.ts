import type { PixelIcon } from "../types";

// Arrow right leaving the frame of `square`: `square-arrow-left-03` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-right-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    ".#.....#",
    ".#.....#.o",
    ".#.......oo",
    ".#...ooooooo",
    ".#...ooooooo",
    ".#.......oo",
    ".#.....#.o",
    ".#.....#",
    "..#####",
  ],
};

export default icon;
