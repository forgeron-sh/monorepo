import type { PixelIcon } from "../types";

// All bookmarks: a bookmark in front of a second one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "all-bookmark",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...########",
    "...#......#",
    ".########.#",
    ".#......#.#",
    ".#......#.#",
    ".#......#.#",
    ".#......#.#",
    ".#......#.#",
    ".#..##..#",
    ".#.#..#.#",
    ".##....##",
  ],
};

export default icon;
