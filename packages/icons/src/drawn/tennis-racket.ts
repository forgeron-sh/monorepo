import type { PixelIcon } from "../types";

// Tennis racket: an oval head with crossed strings in the secondary tone, on a short handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tennis-racket",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..#.o..o.#",
    "..#oooooo#",
    "..#.o..o.#",
    "..#oooooo#",
    "...#o..o#",
    "....####",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
