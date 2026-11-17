import type { PixelIcon } from "../types";

// Folder with a cog badge, the cog of calendar-cog.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-cog",
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
    ".#.....o.o",
    ".#....ooooo",
    ".####.oo.oo",
    "......ooooo",
    ".......o.o",
  ],
};

export default icon;
