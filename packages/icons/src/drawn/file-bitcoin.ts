import type { PixelIcon } from "../types";

// A document and a bitcoin sign badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-bitcoin",
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
    ".#....oooo",
    ".#....o...o",
    ".#....oooo",
    ".#....o...o",
    ".####.oooo",
  ],
};

export default icon;
