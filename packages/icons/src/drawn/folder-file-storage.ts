import type { PixelIcon } from "../types";

// Folder with a file badge: a small sheet with a folded corner at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-file-storage",
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
    ".#......ooo",
    ".#......o.oo",
    ".####...o..o",
    "........o..o",
    "........oooo",
  ],
};

export default icon;
