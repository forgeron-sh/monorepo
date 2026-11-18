import type { PixelIcon } from "../types";

// Archived folder: the cut folder of `folder-remove`, an archive box badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-archive",
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
    ".#....ooooo",
    ".#....o...o",
    ".####.ooooo",
    ".......o.o",
    ".......ooo",
  ],
};

export default icon;
