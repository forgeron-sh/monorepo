import type { PixelIcon } from "../types";

// File with a sync badge: a ring of two arrows turning.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-sync",
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
    ".#....o...o",
    ".#....oo..o",
    ".#....o..oo",
    ".####..ooo",
  ],
};

export default icon;
