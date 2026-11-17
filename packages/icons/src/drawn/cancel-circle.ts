import type { PixelIcon } from "../types";

// Ring with a small cross, 4×4 on a 2×2 centre (larger, its arms touched the ring).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the cross.
const icon: PixelIcon = {
  name: "cancel-circle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
