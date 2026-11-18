import type { PixelIcon } from "../types";

// Currency sign: a ring with four short diagonal spokes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "currency",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#........#",
    "..#......#",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
    "..#......#",
    ".#........#",
  ],
};

export default icon;
