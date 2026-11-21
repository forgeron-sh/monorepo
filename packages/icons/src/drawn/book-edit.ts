import type { PixelIcon } from "../types";

// Book with a pencil badge in the secondary tone: the spine of `book-02`, cut back by the lower-right badge corner of `file-edit`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-edit",
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
    ".#.#....#..o",
    ".#.#.....oo",
    ".#.#....o.o",
    ".#.#...o.o",
    ".#####.oo",
  ],
};

export default icon;
