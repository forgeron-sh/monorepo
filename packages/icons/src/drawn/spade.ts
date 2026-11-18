import type { PixelIcon } from "../types";

// Spade: the card suit, a pointed leaf on a stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "spade",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    "..###..###",
    ".....##",
    "....####",
  ],
};

export default icon;
