import type { PixelIcon } from "../types";

// Fishing rod: a rod on the diagonal, its line and hook in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fishing-rod",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#o",
    ".........#.o",
    "........#..o",
    ".......#...o",
    "......#....o",
    ".....#.....o",
    "....#......o",
    "...#.....o.o",
    "..#......ooo",
    ".#",
    "#",
  ],
};

export default icon;
