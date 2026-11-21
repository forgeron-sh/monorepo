import type { PixelIcon } from "../types";

// Book A: the book with a letter A badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-a",
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
    ".#.#.o...o",
    ".#.#.ooooo",
    ".#.#.o...o",
    ".####o...o",
  ],
};

export default icon;
