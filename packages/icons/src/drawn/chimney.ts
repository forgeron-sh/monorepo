import type { PixelIcon } from "../types";

// Chimney: a stack on a pitched roof with smoke rising in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chimney",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    "........o",
    "........###",
    ".....##.#.#",
    "....#..##.#",
    "...#....#.#",
    "..#......##",
    ".#........#",
    "#.#......#.#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
