import type { PixelIcon } from "../types";

// Sausage on the diagonal, tied at both ends.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sausage",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".......###",
    "......#..#",
    ".....#...#",
    "....#...#",
    "...#...#",
    "..#...#",
    "..#..#",
    "..###",
    ".#",
  ],
};

export default icon;
