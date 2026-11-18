import type { PixelIcon } from "../types";

// Bacterium: a rod-shaped cell lying diagonally with a wavy flagellum in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bacteria",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......###",
    ".....#...#",
    "....#....#",
    "...#....#",
    "..#....#",
    ".#....#",
    ".#...#",
    "..###",
    "o",
    ".o",
    "o",
  ],
};

export default icon;
