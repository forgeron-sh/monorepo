import type { PixelIcon } from "../types";

// One large and one small solid star.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stars",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".......ooo",
    "......ooooo",
    "....#..ooo",
    "...###.o.o",
    "#########",
    ".#######",
    "..#####",
    "..##.##",
    ".##...##",
  ],
};

export default icon;
