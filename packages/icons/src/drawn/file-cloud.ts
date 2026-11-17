import type { PixelIcon } from "../types";

// File with a cloud badge (the badge of folder-cloud).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-cloud",
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
    ".#",
    ".#......oo",
    ".#.....o..o",
    ".#....o...o",
    ".####.ooooo",
  ],
};

export default icon;
