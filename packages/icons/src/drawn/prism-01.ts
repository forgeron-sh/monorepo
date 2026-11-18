import type { PixelIcon } from "../types";

// Optical prism splitting a beam into rays.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "prism-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....#..#",
    "....#..#..oo",
    "...#....#",
    "####....#.oo",
    "..#......#",
    "..#......#oo",
    "..########",
  ],
};

export default icon;
