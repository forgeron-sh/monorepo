import type { PixelIcon } from "../types";

// Oven: a box with a control strip of two knobs in the secondary tone and a door window.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "oven",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.oo..oo.#",
    ".##########",
    ".#........#",
    ".#.######.#",
    ".#.#....#.#",
    ".#.#....#.#",
    ".#.######.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
