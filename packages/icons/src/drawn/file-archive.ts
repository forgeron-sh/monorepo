import type { PixelIcon } from "../types";

// Archived file: the sheet of `file-x`, an archive box badge in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-archive",
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
    ".#....ooooo",
    ".#....o...o",
    ".#....ooooo",
    ".#.....o.o",
    ".####..ooo",
  ],
};

export default icon;
