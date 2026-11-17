import type { PixelIcon } from "../types";

// Three circles of a grid and a gear badge in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-circle-settings",
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
    ".......o.o",
    "..##..ooooo",
    ".#..#.oo.oo",
    ".#..#.ooooo",
    "..##...o.o",
  ],
};

export default icon;
