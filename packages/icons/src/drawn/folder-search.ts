import type { PixelIcon } from "../types";

// Folder with a magnifier badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-search",
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
    ".#....ooo",
    ".#....o.o",
    ".####.ooo",
    ".........o",
    "..........o",
  ],
};

export default icon;
