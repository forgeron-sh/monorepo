import type { PixelIcon } from "../types";

// Square with a variable x.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "x-variable-square",
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
    ".#...oo...#",
    ".#...oo...#",
    ".#.oo..oo.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
