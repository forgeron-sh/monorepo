import type { PixelIcon } from "../types";

// Folder with a download arrow badge, built like `folder-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-download",
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
    ".#......o",
    ".#......o",
    ".####.o.o.o",
    ".......ooo",
    "........o",
  ],
};

export default icon;
