import type { PixelIcon } from "../types";

// A double chevron pointing up in the frame of `square`, mirror of `square-arrow-down-double`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-up-double",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
