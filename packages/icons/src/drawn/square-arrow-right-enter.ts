import type { PixelIcon } from "../types";

// An arrow entering a box open on its left: enter, mirror of `logout-square-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-arrow-right-enter",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    "..........#",
    ".....oo...#",
    "......oo..#",
    ".oooooooo.#",
    ".oooooooo.#",
    "......oo..#",
    ".....oo...#",
    "..........#",
    "......#####",
  ],
};

export default icon;
