import type { PixelIcon } from "../types";

// Contactless: three arcs growing to the right, two-pixel gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "nfc",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......#",
    "....#...#",
    ".....#...#",
    "..#...#..#",
    "...#..#..#",
    "...#..#..#",
    "..#...#..#",
    ".....#...#",
    "....#...#",
    ".......#",
  ],
};

export default icon;
