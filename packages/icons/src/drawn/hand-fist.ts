import type { PixelIcon } from "../types";

// Fist: four knuckles, the thumb folded along the side, a solid palm and the cuff of `hand`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-fist",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....#.#.#.#",
    "....#.#.#.#",
    "...########",
    "..#.#######",
    "..#.#######",
    "...#.######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
