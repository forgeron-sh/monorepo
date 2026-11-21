import type { PixelIcon } from "../types";

// Folder with a padlock badge, built like `folder-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-lock",
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
    ".#.....o.o",
    ".####.ooooo",
    "......oo.oo",
    "......ooooo",
  ],
};

export default icon;
