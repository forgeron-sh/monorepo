import type { PixelIcon } from "../types";

// Two fingers: `hand` with the index and middle fingers raised, the others and the thumb folded.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "two-finger-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "....#.#",
    "....#.#",
    "....#.#.#.#",
    "....#######",
    "....#######",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
