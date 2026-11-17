import type { PixelIcon } from "../types";

// Double ampersand: two & signs side by side, logical and.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ampersands",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##....##",
    "#..#..#..#",
    "#.#...#.#",
    ".#.....#",
    "#.#.#.#.#.#",
    "#..#..#..#",
    ".##.#..##.#",
  ],
};

export default icon;
