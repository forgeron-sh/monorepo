import type { PixelIcon } from "../types";

// Waving hand, back of the hand: `waving-hand-01` mirrored, the motion mark on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "waving-hand-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o",
    "o",
    ".o....#",
    "....#.#.#",
    "..#.#.#.#",
    "..#.#.#.#..#",
    "..#######.#",
    "..########",
    "..#######",
    "...#####",
    "",
    "...#####",
  ],
};

export default icon;
