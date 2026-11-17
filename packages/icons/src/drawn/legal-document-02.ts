import type { PixelIcon } from "../types";

// Document with text lines and an official seal in the corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "legal-document-02",
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
    ".#.##..ooo",
    ".#....o...o",
    ".#.##.o...o",
    ".#....o...o",
    ".####..ooo",
  ],
};

export default icon;
