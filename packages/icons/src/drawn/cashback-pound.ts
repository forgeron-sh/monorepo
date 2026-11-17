import type { PixelIcon } from "../types";

// Cashback in pounds: the anticlockwise ring of `rotate-left-01` around a pound sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cashback-pound",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#....oo..#",
    "###..o....#",
    ".#..ooo...#",
    ".....o....#",
    "....oooo..#",
    "..........#",
    ".........#",
    "......###",
  ],
};

export default icon;
