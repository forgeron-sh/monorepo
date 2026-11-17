import type { PixelIcon } from "../types";

// A parallelogram: four sides leaning at a steady 1:2 slope.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "parallelogram",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....########",
    "....#......#",
    "...#......#",
    "...#......#",
    "..#......#",
    "..#......#",
    ".#......#",
    ".########",
  ],
};

export default icon;
