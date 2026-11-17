import type { PixelIcon } from "../types";

// Two tall rectangles side by side, stretched across the full height.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stretch-vertical",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
