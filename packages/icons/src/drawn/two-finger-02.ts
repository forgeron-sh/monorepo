import type { PixelIcon } from "../types";

// Two fingers, back of the hand: `two-finger-01` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "two-finger-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....#.#",
    ".....#.#",
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
