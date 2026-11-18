import type { PixelIcon } from "../types";

// Convex lens: a lens that bulges on both sides.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lens-convex",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
