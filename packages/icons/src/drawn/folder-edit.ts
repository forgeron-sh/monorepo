import type { PixelIcon } from "../types";

// Folder with a pencil badge, the pencil of file-edit.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-edit",
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
    ".#.......oo",
    ".#......o.o",
    ".####..o.o",
    "......o.o",
    "......oo",
  ],
};

export default icon;
