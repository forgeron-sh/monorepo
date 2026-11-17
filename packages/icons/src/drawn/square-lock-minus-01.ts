import type { PixelIcon } from "../types";

// A square padlock with a minus badge in the lower right corner, like `circle-lock-minus-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-lock-minus-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "..#....#",
    "..#....#",
    ".########",
    ".#......#",
    ".#..oo..#",
    ".#..oo..#",
    ".#",
    ".#.....ooooo",
    ".#####",
  ],
};

export default icon;
