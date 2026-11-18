import type { PixelIcon } from "../types";

// Two chevrons pointing right in a ring, `circle-arrow-down-double` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-right-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#.o..o...#",
    ".#..o..o..#",
    ".#...o..o.#",
    ".#...o..o.#",
    ".#..o..o..#",
    ".#.o..o...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
