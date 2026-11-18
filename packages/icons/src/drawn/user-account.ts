import type { PixelIcon } from "../types";

// Account: a person, the head in the secondary tone, in the box of `checkmark-square-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-account",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".#..####..#",
    ".#.#....#.#",
    ".#.#....#.#",
    "..########",
  ],
};

export default icon;
