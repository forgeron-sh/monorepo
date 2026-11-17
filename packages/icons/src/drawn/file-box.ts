import type { PixelIcon } from "../types";

// A document and a box badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-box",
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
    ".#.....ooo",
    ".#....ooooo",
    ".#....o...o",
    ".#....o...o",
    ".####.ooooo",
  ],
};

export default icon;
