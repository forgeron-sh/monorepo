import type { PixelIcon } from "../types";

// File with a pencil badge in the secondary tone, the file of file-add and its lower-right badge corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-edit",
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
    ".#.......oo",
    ".#......o.o",
    ".#.....o.o",
    ".#....o.o",
    ".####.oo",
  ],
};

export default icon;
