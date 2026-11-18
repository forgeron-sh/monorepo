import type { PixelIcon } from "../types";

// A pointing hand pressing a bar: a touch interaction. Hand of `swipe-right-01`, one row shorter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "touch-interaction-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..oooooo",
    "..o....o",
    "..oooooo",
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
