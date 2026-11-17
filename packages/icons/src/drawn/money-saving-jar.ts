import type { PixelIcon } from "../types";

// Jar with a coin inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-saving-jar",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
