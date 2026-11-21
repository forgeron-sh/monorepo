import type { PixelIcon } from "../types";

// Ice skate: a boot on a blade in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ice-skating",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..####",
    "..#..#",
    "..#..#",
    "..#..#",
    "..#...##",
    "..#.....##",
    "..#.......#",
    "..#########",
    "...#....#",
    ".oooooooooo",
  ],
};

export default icon;
