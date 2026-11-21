import type { PixelIcon } from "../types";

// A table split into three columns.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "table-columns-split",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".##########",
  ],
};

export default icon;
