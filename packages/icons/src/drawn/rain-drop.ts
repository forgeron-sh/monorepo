import type { PixelIcon } from "../types";

// Water drop: a pointed top widening to a round bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rain-drop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
