import type { PixelIcon } from "../types";

// Pivot table: a header row, a header column, and an arrow in the secondary tone turning one into the other.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pivot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    "....#######",
    ".###",
    ".#.#....o",
    ".#.#...ooo",
    ".#.#..o.o",
    ".#.#.oooo",
    ".#.#..o",
    ".###",
  ],
};

export default icon;
