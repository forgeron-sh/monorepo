import type { PixelIcon } from "../types";

// Book with a headphones badge in the secondary tone, an audiobook.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-headphones",
  implemented: true,
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
    ".#.#..o...o",
    ".#.#..o...o",
    ".#.#..oo.oo",
    ".####.oo.oo",
  ],
};

export default icon;
