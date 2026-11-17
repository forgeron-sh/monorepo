import type { PixelIcon } from "../types";

// At sign: an open ring around a small a whose stem runs out to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "at",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..####..#",
    ".#.#...#..#",
    ".#.#...#..#",
    ".#..#######",
    ".#",
    "..#",
    "...######",
  ],
};

export default icon;
