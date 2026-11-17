import type { PixelIcon } from "../types";

// Bookmark: a ribbon with a notched end.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookmark-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..##....##",
  ],
};

export default icon;
