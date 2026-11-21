import type { PixelIcon } from "../types";

// Shopping bag of `shopping-bag-add` with a star badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shopping-bag-favorite",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "..########",
    "..#......#",
    "..#",
    ".#.......o",
    ".#.....ooooo",
    ".#......ooo",
    ".#####..ooo",
    ".......o...o",
  ],
};

export default icon;
