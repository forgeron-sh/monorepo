import type { PixelIcon } from "../types";

// Three circles of a grid and a minus badge in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-circle-remove",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##...##",
    ".#..#.#..#",
    ".#..#.#..#",
    "..##...##",
    "",
    "",
    "..##",
    ".#..#.ooooo",
    ".#..#",
    "..##",
  ],
};

export default icon;
