import type { PixelIcon } from "../types";

// A left chevron in the frame of `square`: `square-chevron-right` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-chevron-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#....oo..#",
    ".#...oo...#",
    ".#..oo....#",
    ".#..oo....#",
    ".#...oo...#",
    ".#....oo..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
