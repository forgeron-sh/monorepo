import type { PixelIcon } from "../types";

// Rhombus, a plain diamond shape with two-pixel tips, centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "diamond-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
