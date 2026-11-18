import type { PixelIcon } from "../types";

// Second-place medal: two straps over a large disc with a 2 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "medal-second-place",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..##....##",
    "...#....#",
    "....#..#",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#.....o..#",
    ".#....o...#",
    ".#...oooo.#",
    "..#......#",
    "...######",
  ],
};

export default icon;
