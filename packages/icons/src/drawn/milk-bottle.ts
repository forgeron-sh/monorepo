import type { PixelIcon } from "../types";

// A milk bottle with a wide neck, filled with milk in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "milk-bottle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    "..#oooooo#",
    "..#oooooo#",
    "..#oooooo#",
    "..#oooooo#",
    "..#oooooo#",
    "..########",
  ],
};

export default icon;
