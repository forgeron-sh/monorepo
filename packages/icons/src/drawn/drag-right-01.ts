import type { PixelIcon } from "../types";

// Drag right: the fist of the set, cut at the wrist, under an arrow to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "drag-right-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".oooooooooo",
    "..........o",
    "",
    "....#.#.#.#",
    "....#.#.#.#",
    "...########",
    "..#.#######",
    "..#.#######",
    "...#.######",
    ".....#####",
  ],
};

export default icon;
