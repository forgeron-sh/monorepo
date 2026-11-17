import type { PixelIcon } from "../types";

// Two books and a leaning one in the secondary tone in the frame of `square`, the shelf of `folder-library`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-library",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.o.o.o..#",
    ".#.o.o.o..#",
    ".#.o.o.o..#",
    ".#.o.o..o.#",
    ".#.o.o..o.#",
    ".#.o.o..o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
