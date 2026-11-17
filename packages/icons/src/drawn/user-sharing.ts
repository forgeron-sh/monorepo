import type { PixelIcon } from "../types";

// Person with an arrow badge leaving up and right, to share.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "user-sharing",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...#..#",
    "...#..#",
    "....##",
    "",
    "..###...ooo",
    ".#.......oo",
    ".#......o.o",
    ".#.....o",
    ".####.o",
  ],
};

export default icon;
