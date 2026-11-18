import type { PixelIcon } from "../types";

// Two crossed swords: one-pixel blades crossing at the centre, guards and grips at the bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swords",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
    "..#.#..#.#",
    "...#....#",
    "..#.#..#.#",
    ".#........#",
  ],
};

export default icon;
