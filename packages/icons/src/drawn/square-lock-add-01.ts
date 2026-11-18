import type { PixelIcon } from "../types";

// A square padlock with a plus badge in the lower right corner, like `circle-lock-add-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-lock-add-01",
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
    ".#..oo",
    ".#..oo...o",
    ".#.......o",
    ".#.....ooooo",
    ".#####...o",
    ".........o",
  ],
};

export default icon;
