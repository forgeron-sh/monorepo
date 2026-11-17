import type { PixelIcon } from "../types";

// File with an eye badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-view",
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
    ".#.....ooo",
    ".#....o.o.o",
    ".#.....ooo",
    ".####",
  ],
};

export default icon;
