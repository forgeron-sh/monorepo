import type { PixelIcon } from "../types";

// Bookshelf cabinet: books in the top compartment in the secondary tone, a drawer below, two feet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookshelf-02",
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
    ".#........#",
    ".#...##...#",
    ".#........#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
