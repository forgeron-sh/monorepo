import type { PixelIcon } from "../types";

// Duplex: a gabled house split into two storeys by a floor line in the secondary tone, a window above, a door below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "duplex",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#...##...#",
    ".#...##...#",
    ".#oooooooo#",
    ".#...##...#",
    ".#...##...#",
    ".##########",
  ],
};

export default icon;
