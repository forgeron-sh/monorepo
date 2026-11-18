import type { PixelIcon } from "../types";

// Folder with a heart badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-heart",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#...######",
    ".#........#",
    ".#........#",
    ".#",
    ".#",
    ".#....oo.oo",
    ".####.ooooo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
