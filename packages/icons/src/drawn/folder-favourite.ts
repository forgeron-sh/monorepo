import type { PixelIcon } from "../types";

// Favourite folder: `folder-lock` with a star badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-favourite",
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
    ".#....ooooo",
    ".####..ooo",
    ".......ooo",
    "......o...o",
  ],
};

export default icon;
