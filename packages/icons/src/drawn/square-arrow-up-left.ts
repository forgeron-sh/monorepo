import type { PixelIcon } from "../types";

// An arrow pointing up and left in the frame of `square`, mirror of `square-arrow-up-right`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-up-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.oooo...#",
    ".#.oo.....#",
    ".#.o.o....#",
    ".#.o..o...#",
    ".#.....o..#",
    ".#......o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
