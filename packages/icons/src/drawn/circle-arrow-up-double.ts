import type { PixelIcon } from "../types";

// Two chevrons pointing up in a ring, `circle-arrow-down-double` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-up-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o....o.#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.o....o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
