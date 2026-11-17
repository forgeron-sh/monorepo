import type { PixelIcon } from "../types";

// Three circles of a grid and a pencil badge in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-circle-edit",
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
    ".........oo",
    "..##....o.o",
    ".#..#..o.o",
    ".#..#.o.o",
    "..##..oo",
  ],
};

export default icon;
