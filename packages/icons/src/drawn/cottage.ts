import type { PixelIcon } from "../types";

// Cottage: a house with a pitched roof, a chimney and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cottage",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##.##",
    "....#..###",
    "...#....##",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#...##...#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
