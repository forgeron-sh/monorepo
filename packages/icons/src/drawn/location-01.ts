import type { PixelIcon } from "../types";

// Map pin: a drop with a ring inside, 10×10 and centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the inner ring.
const icon: PixelIcon = {
  name: "location-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
