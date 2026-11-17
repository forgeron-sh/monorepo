import type { PixelIcon } from "../types";

// Gavel: a tilted head on a handle, over a sound block.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "legal-hammer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....###",
    "......###",
    "......####",
    ".....##.##",
    "....##",
    "...##",
    "..##",
    "..#..######",
    ".....######",
  ],
};

export default icon;
