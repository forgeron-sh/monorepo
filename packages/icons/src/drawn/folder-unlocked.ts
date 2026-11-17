import type { PixelIcon } from "../types";

// Folder with an open padlock badge, the lock of `folder-lock` with its shackle open.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-unlocked",
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
    ".#.....ooo",
    ".#.....o",
    ".####.ooooo",
    "......oo.oo",
    "......ooooo",
  ],
};

export default icon;
