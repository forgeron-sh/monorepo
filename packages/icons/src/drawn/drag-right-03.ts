import type { PixelIcon } from "../types";

// Drag an item right: the fist of the set, cut at the wrist, under a small box and an arrow to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "drag-right-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".oooo.....o",
    ".o..o.ooooo",
    ".oooo.....o",
    "",
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
