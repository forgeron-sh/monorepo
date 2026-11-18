import type { PixelIcon } from "../types";

// Shaka sign: the hand of `hand-metal` with only the thumb and the little finger out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shaka-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    "........#",
    "#.......#",
    ".#..#.#.#",
    "..#######",
    "..#######",
    "..#######",
    "...#####",
    "...#####",
    "...#####",
  ],
};

export default icon;
