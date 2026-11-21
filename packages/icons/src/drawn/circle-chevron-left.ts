import type { PixelIcon } from "../types";

// A chevron pointing left in the ring of `circle-arrow-down-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-chevron-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....oo..#",
    ".#...oo...#",
    ".#..oo....#",
    ".#..oo....#",
    ".#...oo...#",
    ".#....oo..#",
    "..#......#",
    "...######",
  ],
};

export default icon;
