import type { PixelIcon } from "../types";

// Book image: the book with a small picture badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-image",
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
    ".#.#.ooooo",
    ".#.#.o...o",
    ".#.#.o.o.o",
    ".#.#.oo.oo",
    ".####ooooo",
  ],
};

export default icon;
