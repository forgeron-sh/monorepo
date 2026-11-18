import type { PixelIcon } from "../types";

// Folder with an information badge: a serif `i` in the secondary tone at the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-details",
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
    ".#.......o",
    ".#",
    ".####...oo",
    ".........o",
    "........ooo",
  ],
};

export default icon;
