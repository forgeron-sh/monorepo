import type { PixelIcon } from "../types";

// Microsoft admin: a shield split into four by a cross, two quarters in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "microsoft-admin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    ".##########",
    ".#oooo#...#",
    ".#oooo#...#",
    ".#oooo#...#",
    ".##########",
    ".#....#ooo#",
    ".#....#ooo#",
    "..#...#oo#",
    "...#..#o#",
    "....####",
    ".....##",
  ],
};

export default icon;
