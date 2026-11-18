import type { PixelIcon } from "../types";

// Book with a padlock badge in the shared lower-right corner, the base of `book-edit`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-lock",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.#....#",
    ".#.#....#",
    ".#.#....#",
    ".#.#",
    ".#.#...ooo",
    ".#.#...o.o",
    ".#.#..ooooo",
    ".#.#..oo.oo",
    ".####.ooooo",
  ],
};

export default icon;
