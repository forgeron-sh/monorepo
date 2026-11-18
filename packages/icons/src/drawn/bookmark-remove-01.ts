import type { PixelIcon } from "../types";

// Bookmark (`bookmark-01`) with a minus in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookmark-remove-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..##....##",
  ],
};

export default icon;
