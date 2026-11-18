import type { PixelIcon } from "../types";

// Gallery at its end: a card on the right, the edges of the previous cards stacked on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gallery-horizontal-end",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "..#.#.....#",
    "#.#.#.....#",
    "#.#.#.....#",
    "#.#.#.....#",
    "#.#.#.....#",
    "#.#.#.....#",
    "#.#.#.....#",
    "..#.#.....#",
    "....#######",
  ],
};

export default icon;
