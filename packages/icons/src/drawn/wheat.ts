import type { PixelIcon } from "../types";

// Wheat: an ear of three pairs of grains on a stalk.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wheat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "...#.#.#",
    "....###",
    "...#.#.#",
    "....###",
    "...#.#.#",
    "....###",
    ".....#",
    ".....#",
    ".....#",
  ],
};

export default icon;
