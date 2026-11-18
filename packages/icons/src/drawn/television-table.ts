import type { PixelIcon } from "../types";

// A television standing on a low cabinet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "television-table",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
    ".....##",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
  ],
};

export default icon;
