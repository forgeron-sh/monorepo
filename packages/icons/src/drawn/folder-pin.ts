import type { PixelIcon } from "../types";

// Folder with a push-pin badge, the pin of file-pin.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-pin",
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
    ".#.....o.o",
    ".####.ooooo",
    "........o",
    "........o",
  ],
};

export default icon;
