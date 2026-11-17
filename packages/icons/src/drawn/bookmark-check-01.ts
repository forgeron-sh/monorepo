import type { PixelIcon } from "../types";

// Bookmark (`bookmark-01`) with a small check in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookmark-check-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#....o.#",
    "..#.o.o..#",
    "..#..o...#",
    "..#......#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..##....##",
  ],
};

export default icon;
