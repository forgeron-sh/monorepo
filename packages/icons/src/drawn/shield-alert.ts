import type { PixelIcon } from "../types";

// Shield with an exclamation mark in the secondary tone; shield-plus base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shield-alert",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    "..#..oo..#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
