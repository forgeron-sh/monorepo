import type { PixelIcon } from "../types";

// Folder with a link badge, the one of `file-link`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-links",
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
