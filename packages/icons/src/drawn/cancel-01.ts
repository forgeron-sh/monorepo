import type { PixelIcon } from "../types";

// Cross: two one-pixel diagonals, eight pixels long, crossing on a 2×2 centre.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cancel-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
  ],
};

export default icon;
