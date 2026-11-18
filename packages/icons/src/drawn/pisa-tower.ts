import type { PixelIcon } from "../types";

// Leaning tower of Pisa: a belfry and three storeys stepped to the right as they rise.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "pisa-tower",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....####",
    ".....#..#",
    "....######",
    "....#....#",
    "....#....#",
    "...#######",
    "...#....#",
    "...#....#",
    "..#######",
    "..#....#",
    "..######",
  ],
};

export default icon;
