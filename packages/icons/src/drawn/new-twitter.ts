import type { PixelIcon } from "../types";

// The X logo mark in pixels: the hollow falling stroke crossed by the thin rising one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "new-twitter",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "####.......#",
    ".#..#.....#",
    ".#..#....#",
    "..#..#..#",
    "...#..##",
    "....#..#",
    "....#..#",
    "....##..#",
    "...#..#..#",
    "..#....#..#",
    ".#.....#..#",
    "#.......####",
  ],
};

export default icon;
