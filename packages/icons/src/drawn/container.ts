import type { PixelIcon } from "../types";

// Shipping container seen from the side: a long box with three panels of short ribs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "container",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#.#.#..#.#.#",
    "#..........#",
    "############",
  ],
};

export default icon;
