import type { PixelIcon } from "../types";

// Drag right with the left hand: `drag-right-01` with the fist mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "drag-right-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".oooooooooo",
    "..........o",
    "",
    ".#.#.#.#",
    ".#.#.#.#",
    ".########",
    ".#######.#",
    ".#######.#",
    ".######.#",
    "..#####",
  ],
};

export default icon;
