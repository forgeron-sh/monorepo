import type { PixelIcon } from "../types";

// Bookshelf: two open shelves of upright books in the secondary tone, the open sibling of `bookshelf-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookshelf-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.......o#",
    ".#.o.o..o.#",
    ".#.o.o.o..#",
    ".##########",
    ".#.o..o...#",
    ".#.o..o.o.#",
    ".#.o..o.o.#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
