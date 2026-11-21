import type { PixelIcon } from "../types";

// Book with a cross badge in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-x",
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
    ".#.#..o...o",
    ".#.#...o.o",
    ".#.#....o",
    ".#.#...o.o",
    ".####.o...o",
  ],
};

export default icon;
