import type { PixelIcon } from "../types";

// Merge: two paths joining into one that goes up, ending in an arrowhead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "merge",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....###",
    "...#.#.#",
    ".....#",
    ".....#",
    ".....#",
    "....#.#",
    "...#...#",
    "..#.....#",
    ".#.......#",
  ],
};

export default icon;
