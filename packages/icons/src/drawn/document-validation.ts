import type { PixelIcon } from "../types";

// Document with two text lines and a check badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "document-validation",
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
    ".#.##",
    ".#........o",
    ".#.##....o",
    ".#....o.o",
    ".####..o",
  ],
};

export default icon;
