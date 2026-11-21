import type { PixelIcon } from "../types";

// Folder transfer: the cut folder of `folder-remove`, two opposite arrows in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-transfer",
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
    ".#....ooooo",
    ".####....o",
    ".......o",
    "......ooooo",
    ".......o",
  ],
};

export default icon;
