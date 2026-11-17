import type { PixelIcon } from "../types";

// Folder with a blocked badge: a ring crossed by a slash at the lower right, as on `user-block-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-block",
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
    ".#......ooo",
    ".#.....o..oo",
    ".####..o.o.o",
    ".......oo..o",
    "........ooo",
  ],
};

export default icon;
