import type { PixelIcon } from "../types";

// Ampoule: a sealed tip, a narrow waist, a body holding liquid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ampoule",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    ".....##",
    "....#..#",
    "...#....#",
    "...#....#",
    "...#oooo#",
    "...#oooo#",
    "...#oooo#",
    "....####",
  ],
};

export default icon;
