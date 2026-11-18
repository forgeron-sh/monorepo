import type { PixelIcon } from "../types";

// Arrow that runs down then turns right, in the ring of `circle-arrow-down-01`: `circle-arrow-move-down-left` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-move-down-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.o......#",
    ".#.o......#",
    ".#.o......#",
    ".#.o...o..#",
    ".#.oooooo.#",
    ".#.....o..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
