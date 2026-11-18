import type { PixelIcon } from "../types";

// Opening quotation marks in a square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "quote-up-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#..o...o.#",
    ".#.o...o..#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
