import type { PixelIcon } from "../types";

// A small monitor standing on the desk of `desk`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "computer-desk-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    "..#....#",
    "..#....#",
    "..######",
    "....##",
    "....##",
    "############",
    ".#.....#...#",
    ".#.....#.o.#",
    ".#.....#####",
    ".#.....#...#",
  ],
};

export default icon;
