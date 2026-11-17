import type { PixelIcon } from "../types";

// Line down then right, arrowhead pointing right: `corner-down-left` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "corner-down-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#",
    ".#......#",
    "..#......#",
    "...########",
    ".........#",
    "........#",
  ],
};

export default icon;
