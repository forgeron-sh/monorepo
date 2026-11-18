import type { PixelIcon } from "../types";

// Recycling: three arrows chasing each other round a triangle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "recycle-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...###..#",
    "....#....#",
    ".........#",
    "..#.....###",
    "..#......#",
    ".#",
    ".#..#.....#",
    "####.######",
    "....#",
  ],
};

export default icon;
