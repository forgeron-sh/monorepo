import type { PixelIcon } from "../types";

// Grid of three columns and two rows.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grid3x2",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
