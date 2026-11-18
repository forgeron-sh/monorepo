import type { PixelIcon } from "../types";

// Folder with a paperclip badge: `folder-01` one row up, the clip in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-attachment",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    ".#...######",
    ".#........#",
    ".#........#",
    ".#......ooo",
    ".#.....o...o",
    ".#.....o.o.o",
    ".####..o.o.o",
    ".......o.o",
    "........o",
  ],
};

export default icon;
