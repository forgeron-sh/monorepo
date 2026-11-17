import type { PixelIcon } from "../types";

// Book with a person badge in the lower-right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-user",
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
    ".#.#...o.o",
    ".#.#...ooo",
    ".#.#",
    ".####.ooooo",
  ],
};

export default icon;
