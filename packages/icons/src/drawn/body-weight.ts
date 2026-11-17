import type { PixelIcon } from "../types";

// A bathroom scale with a dial.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "body-weight",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.######.#",
    ".#.#.oo.#.#",
    ".#.######.#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
