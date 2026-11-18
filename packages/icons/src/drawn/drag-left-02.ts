import type { PixelIcon } from "../types";

// Drag left: `drag-right-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "drag-left-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o",
    ".ooooo.oo.oo",
    ".o",
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
