import type { PixelIcon } from "../types";

// A square padlock with a cross badge in the lower right corner, like `circle-lock-remove-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-lock-remove-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..#....#",
    "..#....#",
    ".########",
    ".#......#",
    ".#..oo",
    ".#..oo.o...o",
    ".#......o.o",
    ".#.......o",
    ".#####..o.o",
    ".......o...o",
  ],
};

export default icon;
