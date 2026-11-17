import type { PixelIcon } from "../types";

// Plus over minus: a small plus, a slash and a small minus, one-pixel strokes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plus-minus-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#......#",
    "...#.....#",
    ".#####..#",
    "...#...#",
    "...#..#",
    ".....#",
    "....#",
    "...#..#####",
    "..#",
    ".#",
  ],
};

export default icon;
