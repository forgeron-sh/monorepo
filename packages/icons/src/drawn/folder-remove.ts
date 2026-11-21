import type { PixelIcon } from "../types";

// Folder with a minus badge, built like `folder-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-remove",
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
    ".#",
    ".####.ooooo",
  ],
};

export default icon;
