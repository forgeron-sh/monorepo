import type { PixelIcon } from "../types";

// Drag left: `drag-right-03` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "drag-left-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o.....oooo",
    ".ooooo.o..o",
    ".o.....oooo",
    "",
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
