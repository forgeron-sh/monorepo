import type { PixelIcon } from "../types";

// A table whose middle row is split into cells.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "table-cells-split",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#..o..o..#",
    ".#..o..o..#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
