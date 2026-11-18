import type { PixelIcon } from "../types";

// Fingers crossed: `two-finger-01` with the middle finger crossed over the index.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "two-finger-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.#",
    ".....#",
    "....#.#",
    "....#.#.#.#",
    "....#######",
    "....#######",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
