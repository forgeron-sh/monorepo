import type { PixelIcon } from "../types";

// Waving hand: the palm of `hand` with a motion mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "waving-hand-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.#...o",
    "..#.#.#.#..o",
    "..#.#.#.#..o",
    "..#.#.#.#.o",
    "#.#######",
    "##.######",
    ".########",
    "..#######",
    "...#####",
    "...#####",
  ],
};

export default icon;
