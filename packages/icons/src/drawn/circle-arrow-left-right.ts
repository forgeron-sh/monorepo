import type { PixelIcon } from "../types";

// An arrow left above an arrow right, in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-left-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#..o.....#",
    ".#.....o..#",
    ".#.oooooo.#",
    ".#.....o..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
