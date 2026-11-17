import type { PixelIcon } from "../types";

// Sleep: a big Z and a small Z above right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zzz",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".........#",
    "........#",
    ".......####",
    "######",
    "....#",
    "...#",
    "..#",
    ".#",
    "######",
  ],
};

export default icon;
