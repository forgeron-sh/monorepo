import type { PixelIcon } from "../types";

// Zipped folder: the folder-01 base with a zipper and its pull in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "folder-zip",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".####",
    ".#...######",
    ".#....o...#",
    ".#....o...#",
    ".#...ooo..#",
    ".#...o.o..#",
    ".#...ooo..#",
    ".##########",
  ],
};

export default icon;
