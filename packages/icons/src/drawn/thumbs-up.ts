import type { PixelIcon } from "../types";

// Thumbs up: the fist of the set turned a quarter turn, a cuff on the left, a two-pixel thumb rising from it,
// the folded fingers marked by a notch on the right edge (without it the thumb sat on a box).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "thumbs-up",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "....##",
    "....##",
    "...#######",
    ".#.#####",
    ".#.#######",
    ".#.#####",
    ".#.#######",
    ".#.#####",
    "...######",
  ],
};

export default icon;
