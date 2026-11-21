import type { PixelIcon } from "../types";

// Folders linked as a structure, the branch lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "structure-folder",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##....##",
    ".####..####",
    ".#..#oo#..#",
    ".####..####",
    "..o",
    "..o",
    ".##o",
    ".####",
    ".#..#",
    ".####",
  ],
};

export default icon;
