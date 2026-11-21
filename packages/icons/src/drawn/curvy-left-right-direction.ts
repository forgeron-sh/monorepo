import type { PixelIcon } from "../types";

// A road that rises and forks into arrows to the left and right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "curvy-left-right-direction",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "..#......#",
    ".####..####",
    "..#.#..#.#",
    "...#.##.#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
