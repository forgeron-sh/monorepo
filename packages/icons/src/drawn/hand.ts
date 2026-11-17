import type { PixelIcon } from "../types";

// Hand: a raised palm with four fingers and the thumb out to the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.#",
    "..#.#.#.#",
    "..#.#.#.#",
    "..#.#.#.#",
    "#.#######",
    "##.######",
    ".########",
    "..#######",
    "...#####",
    "...#####",
  ],
};

export default icon;
