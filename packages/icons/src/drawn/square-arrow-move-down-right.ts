import type { PixelIcon } from "../types";

// An arrow going down then turning right, in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-move-down-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o......#",
    ".#.o......#",
    ".#.o......#",
    ".#.o...o..#",
    ".#.oooooo.#",
    ".#.....o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
