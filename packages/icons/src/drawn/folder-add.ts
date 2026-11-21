import type { PixelIcon } from "../types";

// Folder with a plus badge: `folder-01` one row up, the badge in the secondary tone at the lower
// right, the folder cut back one pixel around it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-add",
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
    ".####.ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
