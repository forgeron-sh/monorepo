import type { PixelIcon } from "../types";

// Folder with a shield badge, the one of `user-shield-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-security",
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
    ".#....ooooo",
    ".#....ooooo",
    ".####.ooooo",
    ".......ooo",
    "........o",
  ],
};

export default icon;
