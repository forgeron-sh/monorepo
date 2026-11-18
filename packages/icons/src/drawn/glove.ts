import type { PixelIcon } from "../types";

// Glove: the hand of `hand` with a wide cuff in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "glove",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "....#.#.#",
    "....#.#.#.#",
    ".#..#.#.#.#",
    "..#.#######",
    "...########",
    "....#######",
    ".....#####",
    "....ooooooo",
    "....ooooooo",
  ],
};

export default icon;
