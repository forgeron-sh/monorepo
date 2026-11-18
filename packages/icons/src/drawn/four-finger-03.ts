import type { PixelIcon } from "../types";

// Four fingers, back of the hand: `four-finger-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "four-finger-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    "...#.#.#",
    ".#.#.#.#",
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
