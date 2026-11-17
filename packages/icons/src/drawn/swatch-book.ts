import type { PixelIcon } from "../types";

// Swatch book: the two sheets of `copy-01`, the front one with a block of colour in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swatch-book",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    "....#.....#",
    ".#######..#",
    ".#ooooo#..#",
    ".#ooooo#..#",
    ".#ooooo####",
    ".#.....#",
    ".#.....#",
    ".#######",
  ],
};

export default icon;
