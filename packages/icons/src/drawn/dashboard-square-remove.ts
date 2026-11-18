import type { PixelIcon } from "../types";

// Three squares of `grid-view` and a minus badge in the fourth place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dashboard-square-remove",
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
    "",
    ".####",
    ".#..#.ooooo",
    ".#..#",
    ".####",
  ],
};

export default icon;
