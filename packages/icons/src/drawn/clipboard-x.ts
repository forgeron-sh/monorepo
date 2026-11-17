import type { PixelIcon } from "../types";

// Clipboard with a cross badge, the cut board of `clipboard-plus`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clipboard-x",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##.#..#.##",
    ".#..####..#",
    ".#........#",
    ".#",
    ".#....o...o",
    ".#.....o.o",
    ".#......o",
    ".#.....o.o",
    ".####.o...o",
  ],
};

export default icon;
