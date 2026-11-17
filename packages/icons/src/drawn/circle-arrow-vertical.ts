import type { PixelIcon } from "../types";

// A double-headed vertical arrow in a ring, `circle-arrow-horizontal` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-arrow-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#...oo...#",
    "..#......#",
    "...######",
  ],
};

export default icon;
