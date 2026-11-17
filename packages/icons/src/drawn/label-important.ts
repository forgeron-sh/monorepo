import type { PixelIcon } from "../types";

// Important label: a tag with a notched tail pointing right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "label-important",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    "..#.....#",
    "...#.....#",
    "....#.....#",
    "....#.....#",
    "...#.....#",
    "..#.....#",
    ".#######",
  ],
};

export default icon;
