import type { PixelIcon } from "../types";

// An up chevron in the frame of `square`: `square-chevron-down` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-chevron-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.oo..oo.#",
    ".#.o....o.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
