import type { PixelIcon } from "../types";

// Two opposite arrows, left above right, in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-left-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#..o.....#",
    ".#.....o..#",
    ".#.oooooo.#",
    ".#.....o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
