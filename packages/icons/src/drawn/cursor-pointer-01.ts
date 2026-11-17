import type { PixelIcon } from "../types";

// Pointing hand: an index finger up, folded fingers and a thumb on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cursor-pointer-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....##",
    "...#..#",
    "...#..#",
    "...#..###",
    "...#..#..##",
    ".###.....#",
    ".#.......#",
    ".#.......#",
    "..#......#",
    "...#....#",
    "...######",
  ],
};

export default icon;
