import type { PixelIcon } from "../types";

// Roller coaster: a loop on a track raised on three supports.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "roller-coaster",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "############",
    ".#...##...#",
    ".#...##...#",
    ".#...##...#",
  ],
};

export default icon;
