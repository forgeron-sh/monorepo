import type { PixelIcon } from "../types";

// An arrow pointing down and right in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-down-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o......#",
    ".#..o.....#",
    ".#...o..o.#",
    ".#....o.o.#",
    ".#.....oo.#",
    ".#...oooo.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
