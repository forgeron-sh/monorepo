import type { PixelIcon } from "../types";

// Leo: a small ring at the lower left, its stroke arching over and ending in a hook.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-leo",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....###",
    "....#...#",
    "....#...#",
    "....#...#",
    "..###...#",
    ".#..#...#",
    ".#..#...#",
    "..##.....#",
    "..........#",
  ],
};

export default icon;
