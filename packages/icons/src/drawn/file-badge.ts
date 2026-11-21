import type { PixelIcon } from "../types";

// A document and a medal badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-badge",
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
    ".#....o...o",
    ".#....o...o",
    ".#.....ooo",
    ".####..o.o",
  ],
};

export default icon;
