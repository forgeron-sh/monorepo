import type { PixelIcon } from "../types";

// Potion: a round-bottomed flask with a cork, liquid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "potion",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#oooooooo#",
    ".#oooooooo#",
    "..#oooooo#",
    "...######",
  ],
};

export default icon;
