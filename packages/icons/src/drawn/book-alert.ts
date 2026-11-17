import type { PixelIcon } from "../types";

// Book alert: the book with an exclamation mark badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-alert",
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
    ".#.#....o",
    ".#.#....o",
    ".#.#....o",
    ".#.#",
    ".####...o",
  ],
};

export default icon;
