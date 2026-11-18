import type { PixelIcon } from "../types";

// The pointing hand of the set with a tap ripple above the fingertip.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tap-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...oooo",
    "..o....o",
    "",
    "....##",
    "...#..#",
    "...#..###",
    "...#..#..##",
    ".###.....#",
    ".#.......#",
    "..#......#",
    "...#....#",
    "...######",
  ],
};

export default icon;
