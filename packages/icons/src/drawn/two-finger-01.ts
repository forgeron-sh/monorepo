import type { PixelIcon } from "../types";

// A hand raising two fingers: a two-finger gesture.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "two-finger-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##.##",
    "...#..#..#",
    "...#..#..#",
    "...#..#..#",
    "...#..#..##",
    ".###......#",
    ".#........#",
    "..#.......#",
    "...#.....#",
    "...######",
  ],
};

export default icon;
