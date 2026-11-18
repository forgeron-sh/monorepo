import type { PixelIcon } from "../types";

// Hand grip: the fist of the set closed on a bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hand-grip",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....#.#.#.#",
    "oooo#o#o#o#o",
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
