import type { PixelIcon } from "../types";

// Structure: a root node and two children in an indented tree, joined by one-pixel elbows.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "structure-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#..#",
    ".####",
    "..#",
    "..#..######",
    "..####....#",
    "..#..######",
    "..#",
    "..#..######",
    "..####....#",
    ".....######",
  ],
};

export default icon;
