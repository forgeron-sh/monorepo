import type { PixelIcon } from "../types";

// Korean script: the syllable ga.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "alphabet-korean",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........#",
    ".#####..#",
    ".....#..#",
    ".....#..#",
    ".....#..###",
    "....#...#",
    "...#....#",
    "..#.....#",
    ".#......#",
    "........#",
  ],
};

export default icon;
