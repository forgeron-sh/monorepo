import type { PixelIcon } from "../types";

// Folder with an eye badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-view",
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
    ".#.....ooo",
    ".####.o.o.o",
    ".......ooo",
  ],
};

export default icon;
