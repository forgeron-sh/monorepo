import type { PixelIcon } from "../types";

// Funnel: a wide mouth narrowing at 1:1 to a two-pixel stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "filter",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....#..#",
    "....####",
  ],
};

export default icon;
