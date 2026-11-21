import type { PixelIcon } from "../types";

// A document and a no-entry badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-block",
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
    ".#....o..oo",
    ".#....o.o.o",
    ".#....oo..o",
    ".####..ooo",
  ],
};

export default icon;
