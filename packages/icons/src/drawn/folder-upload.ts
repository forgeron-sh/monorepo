import type { PixelIcon } from "../types";

// Folder with an upload arrow badge, built like `folder-add`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-upload",
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
    ".#.....ooo",
    ".####.o.o.o",
    "........o",
    "........o",
  ],
};

export default icon;
