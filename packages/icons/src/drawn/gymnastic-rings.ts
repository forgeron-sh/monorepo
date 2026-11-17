import type { PixelIcon } from "../types";

// Gymnastic rings: two rings hanging from two straps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gymnastic-rings",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    ".###....###",
    "#...#..#...#",
    "#...#..#...#",
    "#...#..#...#",
    ".###....###",
  ],
};

export default icon;
