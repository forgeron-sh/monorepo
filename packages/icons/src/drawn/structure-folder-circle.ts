import type { PixelIcon } from "../types";

// Two circles linked to each other and down to a folder: structure-folder with round nodes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "structure-folder-circle",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".#..#oo#..#",
    ".#..#..#..#",
    "..##....##",
    "...o",
    "...o",
    ".##o",
    ".####",
    ".#..#",
    ".####",
  ],
};

export default icon;
