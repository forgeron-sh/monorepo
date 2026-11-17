import type { PixelIcon } from "../types";

// Crescent moon of `moon-02` with a small star in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "moon-star",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###...o",
    "..#.#...ooo",
    ".#..#....o",
    ".#..#",
    ".#..#",
    ".#...#",
    ".#....#####",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
