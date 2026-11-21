import type { PixelIcon } from "../types";

// Lower case: the letters a and b in small letters.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "case-lower",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......#",
    ".......#",
    ".......#",
    ".###...####",
    "....#..#...#",
    ".####..#...#",
    "#...#..#...#",
    ".####..####",
  ],
};

export default icon;
