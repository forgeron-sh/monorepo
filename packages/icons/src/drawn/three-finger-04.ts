import type { PixelIcon } from "../types";

// Three fingers: `three-finger-01` mirrored, the hand seen from the back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "three-finger-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "...#.#.#",
    "...#.#.#",
    ".#.#.#.#",
    ".#######",
    ".#######",
    ".#######",
    "..#####",
    "",
    "..#####",
  ],
};

export default icon;
