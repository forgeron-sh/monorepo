import type { PixelIcon } from "../types";

// Bell with a small plus in the secondary tone, top right like `bell-dot`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bell-plus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........o",
    ".....##.ooo",
    "....#....o",
    "...#",
    "...#....#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".##########",
    "",
    ".....##",
  ],
};

export default icon;
