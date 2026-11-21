import type { PixelIcon } from "../types";

// File with a check badge in the secondary tone, the file of file-add and its lower-right badge corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-check",
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
    ".#........o",
    ".#.......o",
    ".#....o.o",
    ".####..o",
  ],
};

export default icon;
