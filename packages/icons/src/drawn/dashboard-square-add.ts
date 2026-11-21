import type { PixelIcon } from "../types";

// Three squares of `grid-view` and a plus badge in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-square-add",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
    "",
    "........o",
    ".####...o",
    ".#..#.ooooo",
    ".#..#...o",
    ".####...o",
  ],
};

export default icon;
