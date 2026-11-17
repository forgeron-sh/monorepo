import type { PixelIcon } from "../types";

// Radio: a box with an antenna, a square speaker in the secondary tone and a tuning bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "radio",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........#",
    "........#",
    ".##########",
    ".#........#",
    ".#.oooo.#.#",
    ".#.oooo.#.#",
    ".#.oooo.#.#",
    ".#.oooo.#.#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
