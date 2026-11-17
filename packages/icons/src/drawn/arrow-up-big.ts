import type { PixelIcon } from "../types";

// A big outlined arrow pointing up.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-big",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".###....###",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
  ],
};

export default icon;
