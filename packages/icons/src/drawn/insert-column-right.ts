import type { PixelIcon } from "../types";

// Table of two columns with a plus on its right: insert a column after.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "insert-column-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######",
    ".#..#..#",
    ".#..#..#",
    ".#..#..#..o",
    ".#..#..#.ooo",
    ".#..#..#..o",
    ".#..#..#",
    ".#..#..#",
    ".#######",
  ],
};

export default icon;
