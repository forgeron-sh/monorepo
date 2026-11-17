import type { PixelIcon } from "../types";

// Folder with a cloud badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-cloud",
  implemented: true,
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
    ".#......oo",
    ".####..o..o",
    "......o...o",
    "......ooooo",
  ],
};

export default icon;
