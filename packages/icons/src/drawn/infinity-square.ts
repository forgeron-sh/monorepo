import type { PixelIcon } from "../types";

// Infinity in the secondary tone inside the rounded box of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "infinity-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#..o..o..#",
    ".#.o.oo.o.#",
    ".#.o.oo.o.#",
    ".#..o..o..#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
