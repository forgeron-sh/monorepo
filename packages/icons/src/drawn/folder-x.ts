import type { PixelIcon } from "../types";

// Folder with a cross: the cut folder of `folder-remove`, the cross badge of `file-x`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-x",
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
    ".#....o...o",
    ".#.....o.o",
    ".####...o",
    ".......o.o",
    "......o...o",
  ],
};

export default icon;
