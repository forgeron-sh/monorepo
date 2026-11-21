import type { PixelIcon } from "../types";

// Language: a letter A in the secondary tone inside the rounded box of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "language-square",
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
    ".#.oooooo.#",
    ".#.o....o.#",
    ".#.o....o.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
