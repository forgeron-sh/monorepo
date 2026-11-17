import type { PixelIcon } from "../types";

// Trapezoid outline lying flat, wide side down, 1:2 slopes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "trapezoid-line-horizontal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "...#....#",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
