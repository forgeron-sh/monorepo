import type { PixelIcon } from "../types";

// Satellite dish: a tilted bowl with its feed arm and head in the secondary tone, on a short stand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "satellite-dish",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........oo",
    "..#.....oo",
    ".#.#...o",
    ".#..#.o",
    ".#...#",
    ".#....#",
    "..#....#",
    "...#....#",
    "....####",
    ".....#",
    "...#####",
  ],
};

export default icon;
