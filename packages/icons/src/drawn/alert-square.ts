import type { PixelIcon } from "../types";

// Exclamation mark in the box of `checkmark-square-01`: the mark of `alert-circle`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alert-square",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#...oo...#",
    ".#........#",
    "..########",
  ],
};

export default icon;
