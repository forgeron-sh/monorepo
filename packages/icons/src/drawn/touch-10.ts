import type { PixelIcon } from "../types";

// Two-finger touch: the index and middle fingers of the set under a wide arc in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "touch-10",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..ooooo",
    ".o.....o",
    "",
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
