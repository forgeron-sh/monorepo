import type { PixelIcon } from "../types";

// Redo: `undo-02` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "redo-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "........#",
    ".........#",
    "...########",
    "..#......#",
    ".#......#",
    ".#",
    "..#",
    "...#######",
  ],
};

export default icon;
