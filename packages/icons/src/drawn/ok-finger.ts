import type { PixelIcon } from "../types";

// OK sign: `hand` with the index and thumb closed into a ring, three fingers raised.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ok-finger",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "..##..#.#",
    ".#..#.#.#.#",
    ".#..#.#.#.#",
    "..#########",
    "....#######",
    "....#######",
    ".....#####",
    "",
    ".....#####",
  ],
};

export default icon;
