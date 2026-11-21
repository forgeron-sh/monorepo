import type { PixelIcon } from "../types";

// Bookmark with rounded top corners, a short label bar near the top and the notched end of
// `bookmark-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookmark-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..##....##",
  ],
};

export default icon;
