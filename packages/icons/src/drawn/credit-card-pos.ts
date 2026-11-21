import type { PixelIcon } from "../types";

// Card terminal: a screen and keys, a card in the secondary tone in its slot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "credit-card-pos",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...oooooo",
    "...o....o",
    "..########",
    "..#......#",
    "..#.####.#",
    "..#.####.#",
    "..#......#",
    "..#.#..#.#",
    "..#......#",
    "..#.#..#.#",
    "..#......#",
    "..########",
  ],
};

export default icon;
