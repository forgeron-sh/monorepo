import type { PixelIcon } from "../types";

// Mosque with an arcade: the shared dome and crescent finial over a hall of three arches.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mosque-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o..o",
    ".....oo",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    ".##########",
    ".#........#",
    ".###.##.###",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
