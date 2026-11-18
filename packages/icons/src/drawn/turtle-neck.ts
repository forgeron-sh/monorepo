import type { PixelIcon } from "../types";

// A sweater with a high rolled collar: a turtleneck.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "turtle-neck",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    "....o..o",
    "..##oooo##",
    ".#........#",
    "#..#....#..#",
    "#..#....#..#",
    "#..#....#..#",
    "#..#....#..#",
    "####....####",
    "...#....#",
    "...######",
  ],
};

export default icon;
