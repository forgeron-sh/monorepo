import type { PixelIcon } from "../types";

// Closed book: a cover, the spine line, a label in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#.#....#",
    "..#.#.oo.#",
    "..#.#.oo.#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..########",
  ],
};

export default icon;
