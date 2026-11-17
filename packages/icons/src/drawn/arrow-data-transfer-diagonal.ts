import type { PixelIcon } from "../types";

// Diagonal transfer: two parallel arrows, one up-right, one down-left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-data-transfer-diagonal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....###",
    ".....##",
    "....#.#",
    "...#",
    "..#.......#",
    ".#.......#",
    "........#",
    ".....#.#",
    ".....##",
    ".....###",
  ],
};

export default icon;
