import type { PixelIcon } from "../types";

// A small square outline in the secondary tone in the frame of `square`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#..oooo..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..oooo..#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
