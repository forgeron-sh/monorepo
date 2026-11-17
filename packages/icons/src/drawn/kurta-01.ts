import type { PixelIcon } from "../types";

// Kurta: a long tunic with long sleeves, after the collar and shoulders of `shirt-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kurta-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    ".##..##..##",
    "#..........#",
    "#..#....#..#",
    "#..#....#..#",
    "####....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..########",
  ],
};

export default icon;
