import type { PixelIcon } from "../types";

// Hand showing three fingers: index, middle and ring, from `hand`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "three-finger-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.#",
    "..#.#.#",
    "..#.#.#",
    "..#.#.#",
    "..#######",
    "..#######",
    "..#######",
    "..#######",
    "...#####",
    "...#####",
  ],
};

export default icon;
