import type { PixelIcon } from "../types";

// Folder with a clock badge, as in the other folder badges.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-clock",
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
    ".#.....ooo",
    ".#....o.o.o",
    ".####.o.ooo",
    "......o...o",
    ".......ooo",
  ],
};

export default icon;
