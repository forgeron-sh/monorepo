import type { PixelIcon } from "../types";

// Book with a key badge in the secondary tone, a locked or licensed book.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-key",
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
    ".#.#..ooo",
    ".#.#..o.oooo",
    ".#.#..ooo..o",
    ".#.#",
    ".########",
  ],
};

export default icon;
