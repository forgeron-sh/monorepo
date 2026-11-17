import type { PixelIcon } from "../types";

// Thin arrow pointing up: `arrow-down-03` flipped.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "....###",
    "...#.#.#",
    "..#..#..#",
    ".#...#...#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
  ],
};

export default icon;
