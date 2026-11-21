import type { PixelIcon } from "../types";

// Clipboard with an arrow pointing left into it, the cut board of `clipboard-plus`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clipboard-copy",
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
    ".#......o",
    ".#.....o",
    ".#....ooooo",
    ".#.....o",
    ".####...o",
  ],
};

export default icon;
