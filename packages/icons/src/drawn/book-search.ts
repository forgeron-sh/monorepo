import type { PixelIcon } from "../types";

// Book with a magnifying glass badge in the secondary tone in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-search",
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
    ".#.#....#",
    ".#.#",
    ".#.#..ooo",
    ".#.#..o.o",
    ".#.#..ooo",
    ".####....o",
    "..........o",
  ],
};

export default icon;
