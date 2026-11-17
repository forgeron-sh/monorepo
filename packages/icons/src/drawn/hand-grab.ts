import type { PixelIcon } from "../types";

// Grabbing hand: `hand` with its fingers bent forward, shorter, and the thumb out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hand-grab",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..#.#.#.#",
    "..#.#.#.#",
    "#.#######",
    "##.######",
    ".########",
    "..#######",
    "...#####",
    "...#####",
  ],
};

export default icon;
