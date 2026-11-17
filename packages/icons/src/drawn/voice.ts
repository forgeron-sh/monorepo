import type { PixelIcon } from "../types";

// Voice: five sound bars, tallest in the middle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "voice",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "...#.#.#",
    "...#.#.#",
    ".#.#.#.#.#",
    ".#.#.#.#.#",
    ".#.#.#.#.#",
    ".#.#.#.#.#",
    "...#.#.#",
    "...#.#.#",
    ".....#",
  ],
};

export default icon;
