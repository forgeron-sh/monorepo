import type { PixelIcon } from "../types";

// Book with a plus badge in the secondary tone in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-plus",
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
    ".#.#..ooooo",
    ".####...o",
    "........o",
  ],
};

export default icon;
