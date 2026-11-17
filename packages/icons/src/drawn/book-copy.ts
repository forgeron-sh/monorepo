import type { PixelIcon } from "../types";

// Two books, one in front of the other, like `copy-01` with spines.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-copy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.#...#",
    "....#.#...#",
    ".#######..#",
    ".#.#...#..#",
    ".#.#...#..#",
    ".#.#...####",
    ".#.#...#",
    ".#.#...#",
    ".#######",
  ],
};

export default icon;
