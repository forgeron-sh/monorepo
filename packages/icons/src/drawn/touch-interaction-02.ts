import type { PixelIcon } from "../types";

// A pointing hand under two arrows going apart: a touch gesture. Hand of `swipe-right-01`, one row shorter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touch-interaction-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o......o",
    "oooo..oooo",
    ".o......o",
    "",
    "....##",
    "...#..#",
    "...#..###",
    "...#..#..##",
    ".###.....#",
    "..#......#",
    "...#....#",
    "...######",
  ],
};

export default icon;
