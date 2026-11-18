import type { PixelIcon } from "../types";

// The Grok mark: a ring broken where a long slash crosses it from the lower left to the upper
// right.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "grok",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...........#",
    "...####...#",
    "..#......#",
    ".#......#..#",
    ".#.....#...#",
    "#.....#....#",
    "#....#.....#",
    "#...#.....#",
    "#..#......#",
    "..#......#",
    ".#..####",
    "#",
  ],
};

export default icon;
