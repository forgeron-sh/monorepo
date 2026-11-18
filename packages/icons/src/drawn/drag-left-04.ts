import type { PixelIcon } from "../types";

// Drag left: `drag-right-04` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "drag-left-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o",
    ".oooooooooo",
    ".o",
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
