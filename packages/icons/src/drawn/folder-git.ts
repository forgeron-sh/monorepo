import type { PixelIcon } from "../types";

// Folder git.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-git",
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
    ".#.....ooo",
    ".####.oo.oo",
    "......ooo",
  ],
};

export default icon;
