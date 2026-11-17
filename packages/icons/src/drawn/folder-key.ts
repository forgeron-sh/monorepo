import type { PixelIcon } from "../types";

// Folder with a key badge, the key of book-key.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-key",
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
    ".#",
    ".#....ooo",
    ".####.o.ooo",
    "......ooo.o",
  ],
};

export default icon;
