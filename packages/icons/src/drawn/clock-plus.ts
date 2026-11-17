import type { PixelIcon } from "../types";

// Clock with a plus badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "clock-plus",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...#....#",
    ".#...#....#",
    ".#.###",
    ".#......o",
    ".#......o",
    ".#....ooooo",
    "..#.....o",
    "...##...o",
  ],
};

export default icon;
