import type { PixelIcon } from "../types";

// A double down chevron in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-down-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
