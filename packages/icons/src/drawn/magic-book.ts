import type { PixelIcon } from "../types";

// Magic book: the book of `book-plus` with a four-point sparkle badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "magic-book",
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
    ".#.#....o",
    ".#.#....o",
    ".#.#..oo.oo",
    ".####...o",
    "........o",
  ],
};

export default icon;
