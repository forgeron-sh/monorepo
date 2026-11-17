import type { PixelIcon } from "../types";

// File with a small euro sign badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-euro",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#......ooo",
    ".#.....o",
    ".#....oooo",
    ".#.....o",
    ".####...ooo",
  ],
};

export default icon;
