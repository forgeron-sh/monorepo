import type { PixelIcon } from "../types";

// Union of two circles one above the other: one outline around both.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "union-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...#....#",
    "....####",
  ],
};

export default icon;
