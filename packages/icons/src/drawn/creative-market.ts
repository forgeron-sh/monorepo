import type { PixelIcon } from "../types";

// A price tag held on the diagonal, with a ring hole and a star on its face.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "creative-market",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......######",
    ".....#.....#",
    "....#...##.#",
    "...#....##.#",
    "..#........#",
    ".#..#.#....#",
    "#....#....#",
    ".#..#.#..#",
    "..#.....#",
    "...#...#",
    "....#.#",
    ".....#",
  ],
};

export default icon;
