import type { PixelIcon } from "../types";

// Two chevrons pointing left in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-left-double",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o..o.#",
    ".#..o..o..#",
    ".#.o..o...#",
    ".#.o..o...#",
    ".#..o..o..#",
    ".#...o..o.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
