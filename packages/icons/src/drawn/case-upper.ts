import type { PixelIcon } from "../types";

// Upper case: the letters A and B in capitals.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "case-upper",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".###...####",
    "#...#..#...#",
    "#...#..#...#",
    "#...#..####",
    "#####..#...#",
    "#...#..#...#",
    "#...#..#...#",
    "#...#..####",
  ],
};

export default icon;
