import type { PixelIcon } from "../types";

// A double chevron pointing right in the frame of `square`, mirror of `square-arrow-left-double`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-right-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o..o...#",
    ".#..o..o..#",
    ".#...o..o.#",
    ".#...o..o.#",
    ".#..o..o..#",
    ".#.o..o...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
