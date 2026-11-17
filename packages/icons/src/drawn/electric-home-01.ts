import type { PixelIcon } from "../types";

// A house with a lightning bolt inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "electric-home-01",
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
    ".#....oo..#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#...oo...#",
    ".#..oo....#",
    ".##########",
  ],
};

export default icon;
