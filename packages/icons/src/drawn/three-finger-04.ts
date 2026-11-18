import type { PixelIcon } from "../types";

// A hand raising three fingers, thumb folded: a three-finger gesture.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "three-finger-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##.##.##",
    "..#..#..#..#",
    "..#..#..#..#",
    "..#..#..#..#",
    "###........#",
    "#..........#",
    ".#.........#",
    "..#.......#",
    "...#.....#",
    "....#####",
  ],
};

export default icon;
