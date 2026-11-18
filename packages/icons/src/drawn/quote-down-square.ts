import type { PixelIcon } from "../types";

// Closing quotation marks in a square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "quote-down-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#..o...o.#",
    ".#.o...o..#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
