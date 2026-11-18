import type { PixelIcon } from "../types";

// File with a cross: the sheet of `file-lock`, a cross badge in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-x",
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
    ".#......o",
    ".#.....o.o",
    ".####.o...o",
  ],
};

export default icon;
