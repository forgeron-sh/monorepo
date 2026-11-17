import type { PixelIcon } from "../types";

// The columns of `layout-3-column` with the cog badge of `file-cog`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "columns-3-cog",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#",
    ".#..#...o.o",
    ".#..#..ooooo",
    ".#..#..oo.oo",
    ".#####.ooooo",
    "........o.o",
  ],
};

export default icon;
