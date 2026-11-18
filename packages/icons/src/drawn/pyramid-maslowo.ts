import type { PixelIcon } from "../types";

// Maslow's pyramid: a triangle in three tiers, the top tier filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pyramid-maslowo",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#oo#",
    "....#oo#",
    "...######",
    "...#....#",
    "..#......#",
    "..########",
    ".#........#",
    ".#........#",
    "############",
  ],
};

export default icon;
