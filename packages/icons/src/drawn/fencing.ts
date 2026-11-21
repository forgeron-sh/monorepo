import type { PixelIcon } from "../types";

// Fencing: two crossed foils with their guards and grips.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fencing",
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
