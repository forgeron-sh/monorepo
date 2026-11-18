import type { PixelIcon } from "../types";

// Mosque: the shared dome with a crescent finial in the secondary tone, over a hall with an arched door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mosque-01",
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
    ".#........#",
    ".#...##...#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
