import type { PixelIcon } from "../types";

// Horizontal gallery: a card between the edges of its two neighbours.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gallery-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#.######.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.######.#",
  ],
};

export default icon;
