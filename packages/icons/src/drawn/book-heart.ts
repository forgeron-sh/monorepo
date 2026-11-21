import type { PixelIcon } from "../types";

// Book with a heart badge in the secondary tone, a favourite book.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-heart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#.#....#",
    ".#.#....#",
    ".#.#....#",
    ".#.#....#",
    ".#.#",
    ".#.#..oo.oo",
    ".#.#..ooooo",
    ".#.#...ooo",
    ".#####..o",
  ],
};

export default icon;
