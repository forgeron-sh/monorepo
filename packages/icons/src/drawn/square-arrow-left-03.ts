import type { PixelIcon } from "../types";

// Arrow left leaving the frame of `square`: `square-arrow-up-03` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-left-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#####",
    "....#.....#",
    "..o.#.....#",
    ".oo.......#",
    "ooooooo...#",
    "ooooooo...#",
    ".oo.......#",
    "..o.#.....#",
    "....#.....#",
    ".....#####",
  ],
};

export default icon;
