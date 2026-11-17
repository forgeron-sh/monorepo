import type { PixelIcon } from "../types";

// File with a yen sign badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-yen",
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
    ".#....o...o",
    ".#.....o.o",
    ".#....ooooo",
    ".#......o",
    ".####...o",
  ],
};

export default icon;
