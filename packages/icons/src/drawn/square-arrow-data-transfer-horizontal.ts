import type { PixelIcon } from "../types";

// Two opposite arrows, right above left, in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-data-transfer-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.....o..#",
    ".#.oooooo.#",
    ".#.....o..#",
    ".#..o.....#",
    ".#.oooooo.#",
    ".#..o.....#",
    ".#........#",
    "..########",
  ],
};

export default icon;
